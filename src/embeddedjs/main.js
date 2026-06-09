import Poco from "commodetto/Poco";
import Button from "pebble/button";
import Message from "pebble/message";

const render = new Poco(screen);
const fontSmall = new render.Font("Gothic-Regular", 18);
const font = new render.Font("Gothic-Regular", 24);
const fontBold = new render.Font("Gothic-Bold", 24);
const fontMenu = new render.Font("Gothic-Regular", 28);
const fontFraction = new render.Font("Gothic-Bold", 28);
const fontMedium = new render.Font("Bitham-Black", 30);
const fontBig = new render.Font("Bitham-Bold", 42);
const fontTemperature = new render.Font("Roboto-Bold", 49);
const fontPill = new render.Font("Roboto-Condensed", 21);

const colors = {
  black: render.makeColor(0, 0, 0),
  white: render.makeColor(255, 255, 255),
  dim: render.makeColor(92, 92, 92),
  highlight: render.makeColor(170, 255, 0),
  heat: render.makeColor(255, 85, 0),
  cool: render.makeColor(0, 170, 255),
  menuBg: render.makeColor(85, 85, 85),
  panel: render.makeColor(24, 24, 24),
};

const keys = [
  "COMMAND",
  "REQUEST_ID",
  "DELTA",
  "ACTION",
  "INDEX",
  "VALUE",
  "READY",
  "STATE",
  "ERROR",
];

let state = { screen: "loading", status: "Connecting..." };
let selected = 0;
let busy = false;
let writable = false;
let phoneReady = false;
let requestId = 1;
let initialRequested = false;
let backButton = null;

const message = new Message({
  keys,
  input: 2048,
  output: 256,
  onReadable() {
    const incoming = message.read();
    const next = {};
    incoming.forEach((value, key) => {
      if (typeof value === "string" || typeof value === "number")
        next[String(key)] = value;
    });

    if (next.READY !== undefined) {
      phoneReady = true;
      requestInitialState();
    }

    if (typeof next.STATE === "string") {
      try {
        const nextState = JSON.parse(next.STATE);
        if (state.dashboard && !nextState.dashboard)
          nextState.dashboard = state.dashboard;
        if (state.menu && !nextState.menu) nextState.menu = state.menu;
        state = nextState;
        selected = 0;
      } catch (_) {
        state = { screen: "error", error: "Bad phone response" };
      }
    } else if (typeof next.ERROR === "string") {
      state = { screen: "error", error: next.ERROR };
    }
    busy = false;
    draw();
  },
  onWritable() {
    writable = true;
    requestInitialState();
  },
  onSuspend() {
    writable = false;
  },
});

new Button({
  types: ["select", "up", "down"],
  onPush(down, type) {
    if (!down || busy) return;
    handleButton(type);
  },
});

setTimeout(requestInitialState, 0);
draw();

function handleButton(type) {
  if (state.screen === "dashboard") {
    if (type === "up") sendCommand("ADJUST", { DELTA: 10 }, "Working...");
    else if (type === "down")
      sendCommand("ADJUST", { DELTA: -10 }, "Working...");
    else if (type === "select") openMainMenu();
    return;
  }

  if (state.screen === "pin") {
    if (type === "select")
      sendCommand("AUTHORIZE_PIN", undefined, "Checking...");
    else if (type === "back")
      sendCommand("REFRESH", undefined, "Refreshing...");
    return;
  }

  if (state.screen === "menu" || state.screen === "list") {
    const items = currentItems();
    if (type === "up") selected = Math.max(0, selected - 1);
    else if (type === "down")
      selected = Math.min(items.length - 1, selected + 1);
    else if (type === "back")
      state.screen = state.screen === "list" ? "menu" : "dashboard";
    else if (type === "select") activateSelection();
    draw();
    return;
  }

  if (type === "select" || type === "back")
    sendCommand("REFRESH", undefined, "Refreshing...");
}

function openMainMenu() {
  const dashboard = state.dashboard;
  if (!dashboard) return;

  const menu = [];
  if (dashboard.hasHold)
    menu.push({ title: "Resume Program", value: "RESUME" });
  menu.push({ title: "Home and Hold", value: "HOME" });
  menu.push({ title: "Away and Hold", value: "AWAY" });
  menu.push({ title: "Sleep and Hold", value: "SLEEP" });
  if (dashboard.hasSensors) menu.push({ title: "Sensors", value: "SENSORS" });
  if (dashboard.thermostatCount > 1)
    menu.push({ title: "Thermostats", value: "THERMOSTATS" });
  menu.push({ title: "Change Mode", value: "MODES" });

  state = { ...state, screen: "menu", menu };
  selected = 0;
  draw();
}

function currentItems() {
  return state.screen === "list" ? state.list || [] : state.menu || [];
}

function activateSelection() {
  const item = currentItems()[selected];
  if (!item) return;

  if (state.screen === "menu") {
    if (item.value === "SENSORS")
      sendCommand("LIST", { ACTION: "SENSORS" }, "Loading...");
    else if (item.value === "THERMOSTATS")
      sendCommand("LIST", { ACTION: "THERMOSTATS" }, "Loading...");
    else if (item.value === "MODES")
      sendCommand("LIST", { ACTION: "MODES" }, "Loading...");
    else sendCommand("ACTION", { ACTION: item.value || "" }, "Working...");
  } else if (state.listAction === "SELECT_THERMOSTAT") {
    sendCommand("SELECT_THERMOSTAT", { INDEX: selected }, "Working...");
  } else if (state.listAction === "SET_MODE") {
    sendCommand("SET_MODE", { VALUE: item.value || "" }, "Working...");
  } else {
    return;
  }
}

function requestInitialState() {
  if (initialRequested) return;
  if (writable && phoneReady) {
    if (!sendCommand("INIT")) setTimeout(requestInitialState, 250);
    else initialRequested = true;
  } else setTimeout(requestInitialState, 250);
}

function sendCommand(command, extras, status) {
  if (!writable || !phoneReady) {
    state = { screen: "loading", status: "Connecting..." };
    draw();
    return;
  }

  busy = true;

  const payload = new Map([
    ["COMMAND", command],
    ["REQUEST_ID", requestId++],
  ]);
  if (extras) {
    Object.keys(extras).forEach((key) => payload.set(key, extras[key]));
  }
  try {
    message.write(payload);
    writable = false;
    return true;
  } catch (error) {
    writable = false;
    busy = false;
    if (status) {
      state = { screen: "error", error: error.message || String(error) };
      draw();
    }
    return false;
  }
}

function draw() {
  syncBackButton();
  render.begin();
  render.fillRectangle(colors.black, 0, 0, render.width, render.height);
  drawFrame();

  if (state.screen === "dashboard" && state.dashboard)
    drawDashboard(state.dashboard);
  else if (state.screen === "pin" && state.pin) drawPin(state.pin);
  else if (state.screen === "menu") drawMenu("Hive", state.menu || []);
  else if (state.screen === "list")
    drawMenu(state.listTitle || "Select", state.list || []);
  else if (state.screen === "error")
    drawCentered("Error", state.error || "Unknown error", "Press select");
  else
    drawCentered(
      state.title || "Hive",
      state.body || state.status || "Loading...",
      ""
    );

  render.end();
}

function syncBackButton() {
  const shouldHandleBack = state.screen !== "dashboard";
  if (shouldHandleBack && !backButton) {
    backButton = new Button({
      type: "back",
      onPush(down, type) {
        if (!down || busy) return;
        handleButton(type);
      },
    });
  } else if (!shouldHandleBack && backButton) {
    backButton.close();
    backButton = null;
  }
}

function drawFrame() {
  render.fillRectangle(colors.panel, 0, 0, render.width, 22);
  render.fillRectangle(colors.panel, 0, render.height - 18, render.width, 18);
}

function drawDashboard(dashboard) {
  const modeColor =
    dashboard.modeColor === "heat"
      ? colors.heat
      : dashboard.modeColor === "cool"
        ? colors.cool
        : colors.white;
  const clusterOffset = 24;

  drawThermostatName(dashboard.name);
  drawHumidity(dashboard.humidity, 0, 34 + clusterOffset);
  drawTemperature(dashboard.temperature, 58 + clusterOffset);
  drawDesiredTemperature(dashboard, modeColor, clusterOffset);

  if (dashboard.status)
    drawText(
      dashboard.status,
      fontSmall,
      colors.white,
      0,
      render.height - 42,
      "center"
    );
}

function drawThermostatName(name) {
  if (render.width === render.height) {
    drawText(name, fontBold, colors.white, 0, 6, "center");
    return;
  }

  drawText(name, fontBold, colors.white, 6, 2, "left");
}

function drawHumidity(humidity, x, y) {
  const text = String(humidity || 0) + "%";
  const textWidth = render.getTextWidth(text, font);
  const iconWidth = 20;
  const gap = 5;
  const startX = Math.floor((render.width - iconWidth - gap - textWidth) / 2);

  drawDroplet(startX, y + 2);
  drawText(
    text,
    font,
    colors.white,
    startX + iconWidth + gap,
    y,
    "left",
    textWidth
  );
}

function drawDroplet(x, y) {
  const rows = [
    [1, 10, 1],
    [2, 10, 1],
    [3, 9, 3],
    [4, 9, 3],
    [5, 8, 2, 11, 2],
    [6, 7, 2, 12, 2],
    [7, 7, 1, 13, 1],
    [8, 6, 2, 13, 2],
    [9, 5, 2, 14, 2],
    [10, 5, 1, 15, 1],
    [11, 4, 2, 15, 2],
    [12, 4, 1, 16, 1],
    [13, 4, 1, 16, 1],
    [14, 4, 2, 15, 2],
    [15, 4, 2, 15, 1],
    [16, 5, 2, 14, 2],
    [17, 6, 3, 12, 3],
    [18, 8, 5],
  ];

  rows.forEach((row) => {
    for (let i = 1; i < row.length; i += 2) {
      render.fillRectangle(colors.white, x + row[i], y + row[0], row[i + 1], 1);
    }
  });
}

function drawDesiredTemperature(dashboard, modeColor, offset) {
  const text = desiredTemperatureText(dashboard);
  const pillColor = dashboard.modeColor === "auto" ? colors.white : modeColor;
  const pillWidth = Math.min(
    render.width - 10,
    Math.max(98, render.getTextWidth(text, fontPill) + 42)
  );
  const pillHeight = 34;
  const x = Math.floor((render.width - pillWidth) / 2);
  const y = 116 + offset;

  drawPillBorder(x, y, pillWidth, pillHeight, pillColor);
  if (dashboard.modeColor === "auto")
    drawAutoDesiredTemperature(dashboard, x, y, pillWidth);
  else drawSingleDesiredTemperature(dashboard, modeColor, x, y, pillWidth);
}

function desiredTemperatureText(dashboard) {
  const desired = dashboard.desiredTemperature || "Off";
  return dashboard.hold ? desired + " | Holding" : desired;
}

function drawAutoDesiredTemperature(dashboard, x, y, width) {
  const separator = "-";
  const hold = dashboard.hold ? " | Holding" : "";
  const cool = dashboard.coolHold || "--";
  const heat = dashboard.heatHold || "--";
  const heatWidth = render.getTextWidth(heat, fontPill);
  const separatorWidth = render.getTextWidth(separator, fontPill);
  const coolWidth = render.getTextWidth(cool, fontPill);
  const holdWidth = render.getTextWidth(hold, fontPill);
  const totalWidth = heatWidth + separatorWidth + coolWidth + holdWidth;
  let textX = x + Math.floor((width - totalWidth) / 2);

  render.drawText(heat, fontPill, colors.heat, textX, y + 6);
  textX += heatWidth;
  render.drawText(separator, fontPill, colors.white, textX, y + 6);
  textX += separatorWidth;
  render.drawText(cool, fontPill, colors.cool, textX, y + 6);
  textX += coolWidth;
  if (hold) render.drawText(hold, fontPill, colors.white, textX, y + 6);
}

function drawSingleDesiredTemperature(dashboard, modeColor, x, y, width) {
  const desired = dashboard.desiredTemperature || "Off";
  const hold = dashboard.hold ? " | Holding" : "";
  const desiredWidth = render.getTextWidth(desired, fontPill);
  const holdWidth = render.getTextWidth(hold, fontPill);
  let textX = x + Math.floor((width - desiredWidth - holdWidth) / 2);

  render.drawText(desired, fontPill, modeColor, textX, y + 6);
  textX += desiredWidth;
  if (hold) render.drawText(hold, fontPill, colors.white, textX, y + 6);
}

function drawPillBorder(x, y, width, height, color) {
  const radius = Math.floor(height / 2);
  render.fillRectangle(color, x + radius, y, width - radius * 2, 1);
  render.fillRectangle(
    color,
    x + radius,
    y + height - 1,
    width - radius * 2,
    1
  );
  render.fillRectangle(color, x, y + radius, 1, height - radius * 2);
  render.fillRectangle(
    color,
    x + width - 1,
    y + radius,
    1,
    height - radius * 2
  );
  drawArcCorner(x + radius, y + radius, radius, color, -1, -1);
  drawArcCorner(x + width - radius - 1, y + radius, radius, color, 1, -1);
  drawArcCorner(x + radius, y + height - radius - 1, radius, color, -1, 1);
  drawArcCorner(
    x + width - radius - 1,
    y + height - radius - 1,
    radius,
    color,
    1,
    1
  );
}

function drawArcCorner(cx, cy, radius, color, xSign, ySign) {
  for (let i = 0; i < radius; i++) {
    const x = Math.floor(Math.sqrt(radius * radius - i * i));
    render.fillRectangle(color, cx + xSign * x, cy + ySign * i, 1, 1);
    render.fillRectangle(color, cx + xSign * i, cy + ySign * x, 1, 1);
  }
}

function drawPin(pin) {
  drawText(pin.pin, fontMedium, colors.cool, 0, 56, "center");
  drawWrappedText(
    pin.body || "",
    fontSmall,
    colors.white,
    8,
    98,
    render.width - 16,
    18,
    3
  );
  if (pin.status)
    drawText(
      pin.status,
      fontSmall,
      colors.dim,
      0,
      render.height - 17,
      "center"
    );
}

function drawMenu(title, items) {
  const round = render.width === render.height;
  const headerHeight = 34;
  const top = Math.max(34, headerHeight);
  const bottom = render.height - 18;
  const hasSubtitles = items.some((item) => item && item.subtitle);
  const itemHeight = hasSubtitles ? 48 : 32;
  const itemFont = fontMenu;
  const subtitleFont = fontPill;
  const visible = Math.max(
    1,
    Math.min(items.length, Math.floor((bottom - top) / itemHeight))
  );
  const start = selected >= visible ? selected - visible + 1 : 0;

  render.fillRectangle(colors.black, 0, 0, render.width, headerHeight);
  render.fillRectangle(
    colors.menuBg,
    0,
    headerHeight,
    render.width,
    render.height - headerHeight - 18
  );
  drawThermostatName(title);

  for (let i = 0; i < visible; i++) {
    const index = start + i;
    const item = items[index];
    if (!item) continue;
    const y = top + i * itemHeight;
    const active = index === selected;
    const textX = round ? 0 : 8;
    const textWidth = round ? render.width : render.width - 16;
    const textAlign = round ? "center" : "left";
    if (active)
      render.fillRectangle(colors.black, 0, y, render.width, itemHeight);
    drawText(
      item.title,
      itemFont,
      active ? colors.highlight : colors.white,
      textX,
      y + (hasSubtitles ? 0 : 2),
      textAlign,
      textWidth
    );
    if (item.subtitle)
      drawText(
        item.subtitle,
        subtitleFont,
        active ? colors.highlight : colors.white,
        textX,
        y + 27,
        textAlign,
        textWidth
      );
  }
  drawText(
    selected + 1 + "/" + Math.max(1, items.length),
    fontSmall,
    colors.white,
    0,
    render.height - 17,
    "center"
  );
}

function drawCentered(title, body, footer) {
  drawText(title, fontBold, colors.white, 0, 44, "center");
  drawWrappedText(body, font, colors.white, 8, 74, render.width - 16, 24, 3);
  if (footer)
    drawText(footer, fontSmall, colors.dim, 0, render.height - 17, "center");
}

function drawTemperature(temperature, y) {
  const value = String(temperature || "--");
  const point = value.indexOf(".");
  if (point === -1) {
    drawText(value, fontTemperature, colors.white, 0, y, "center");
    return;
  }

  const whole = value.slice(0, point);
  const decimal = value.slice(point, point + 1);
  const fraction = value.slice(point + 1);
  const wholeWidth = render.getTextWidth(whole, fontTemperature);
  const decimalWidth = render.getTextWidth(decimal, fontFraction);
  const fractionWidth = render.getTextWidth(fraction, fontTemperature);
  let x = Math.floor(
    (render.width - wholeWidth - decimalWidth - fractionWidth) / 2
  );

  render.drawText(whole, fontTemperature, colors.white, x, y);
  render.drawText(decimal, fontFraction, colors.white, x + wholeWidth, y + 15);
  render.drawText(
    fraction,
    fontTemperature,
    colors.white,
    x + wholeWidth + decimalWidth,
    y
  );
}

function drawWrappedText(
  text,
  textFont,
  color,
  x,
  y,
  width,
  lineHeight,
  maxLines
) {
  const words = String(text || "").split(" ");
  let line = "";
  let drawn = 0;

  for (let i = 0; i < words.length && drawn < maxLines; i++) {
    const candidate = line ? line + " " + words[i] : words[i];
    if (line && render.getTextWidth(candidate, textFont) > width) {
      drawText(
        line,
        textFont,
        color,
        x,
        y + drawn * lineHeight,
        "center",
        width
      );
      line = words[i];
      drawn++;
    } else {
      line = candidate;
    }
  }

  if (line && drawn < maxLines)
    drawText(line, textFont, color, x, y + drawn * lineHeight, "center", width);
}

function drawText(text, textFont, color, x, y, align, width) {
  const maxWidth = width || render.width;
  let value = text || "";
  while (value.length > 1 && render.getTextWidth(value, textFont) > maxWidth) {
    value = value.slice(0, value.length - 2) + ".";
  }
  const textWidth = render.getTextWidth(value, textFont);
  const textX = align === "center" ? x + (maxWidth - textWidth) / 2 : x;
  render.drawText(value, textFont, color, textX, y);
}
