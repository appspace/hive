var api = require("./ecobee-api");
var loadThermostats = api.loadThermostats;
var postThermostat = api.postThermostat;
var oauth = require("./oauth");
var getPin = oauth.getPin;
var authorizePin = oauth.authorizePin;
var settingsModule = require("./settings");
var patchSettings = settingsModule.patchSettings;
var settings = settingsModule.settings;
var sendState = require("./watch-state").sendState;
var thermostatUtils = require("./thermostat");
var MAX_SENSOR_ITEMS = 15;

function handleCommand(payload) {
  var command = payload.COMMAND;
  console.log("watch command: " + JSON.stringify(payload));

  if (command === "INIT" || command === "REFRESH") return bootstrap();
  if (command === "AUTHORIZE_PIN") return checkPin();
  if (command === "ADJUST")
    return adjustTemperature(Number(payload.DELTA || 0));
  if (command === "ACTION") return runAction(payload.ACTION);
  if (command === "LIST") return sendList(payload.ACTION);
  if (command === "SELECT_THERMOSTAT")
    return selectThermostat(Number(payload.INDEX || 0));
  if (command === "SET_MODE") return setMode(payload.VALUE);
  return Promise.resolve();
}

function bootstrap() {
  var data = settings();
  if (!data.paired) return showPin();

  return loadThermostats()
    .then(function (list) {
      sendDashboard(list);
    })
    .catch(function (error) {
      if (error.needsPairing) return showPin();
      logHttpErrorBody(error);
      throw error;
    });
}

function showPin() {
  var data = settings();
  if (
    data.authPin &&
    data.authExpires &&
    Date.now() <= data.authExpires - 5000
  ) {
    sendState({
      screen: "pin",
      pin: { pin: data.authPin, body: pinInstructions() },
    });
    return Promise.resolve();
  }

  sendState({
    screen: "loading",
    title: "Authorization",
    body: "Calling ecobee for authorization. Please wait.",
  });
  return getPin().then(function (pin) {
    sendState({
      screen: "pin",
      pin: { pin: pin.ecobeePin, body: pinInstructions() },
    });
  });
}

function checkPin() {
  var data = settings();
  sendState({
    screen: "pin",
    pin: { pin: data.authPin || "", body: pinInstructions() },
  });

  return authorizePin().then(function (result) {
    if (result.paired) return bootstrap();
    if (result.pending) {
      sendState({
        screen: "pin",
        pin: { pin: data.authPin || "", body: pinInstructions() },
      });
      return;
    }
    return showPin();
  });
}

function adjustTemperature(delta) {
  return loadThermostats().then(function (list) {
    var thermostat = thermostatUtils.selectedThermostat(list);
    var hvacMode = thermostat.settings.hvacMode;
    var newHeat = thermostat.runtime.desiredHeat + delta;
    var newCool = thermostat.runtime.desiredCool + delta;

    if (
      (hvacMode === "heat" ||
        hvacMode === "auxHeatOnly" ||
        hvacMode === "auto") &&
      (newHeat > thermostat.settings.heatRangeHigh ||
        newHeat < thermostat.settings.heatRangeLow)
    ) {
      sendDashboard(list, "Heat limit reached");
      return;
    }
    if (
      (hvacMode === "cool" || hvacMode === "auto") &&
      (newCool > thermostat.settings.coolRangeHigh ||
        newCool < thermostat.settings.coolRangeLow)
    ) {
      sendDashboard(list, "Cool limit reached");
      return;
    }

    return postAndRefresh(
      thermostatUtils.createTemperatureHoldEvent(thermostat, newHeat, newCool),
      list
    );
  });
}

function runAction(action) {
  return loadThermostats().then(function (list) {
    var thermostat = thermostatUtils.selectedThermostat(list);
    var body = null;
    if (action === "RESUME")
      body = thermostatUtils.createResumeProgramEvent(thermostat);
    else if (action === "HOME")
      body = thermostatUtils.createClimateHoldEvent(thermostat, "home");
    else if (action === "AWAY")
      body = thermostatUtils.createClimateHoldEvent(thermostat, "away");
    else if (action === "SLEEP")
      body = thermostatUtils.createClimateHoldEvent(thermostat, "sleep");

    if (!body) throw new Error("Unknown action");
    return postAndRefresh(body, list);
  });
}

function sendList(action) {
  return loadThermostats().then(function (list) {
    var thermostat = thermostatUtils.selectedThermostat(list);

    if (action === "SENSORS") {
      var sensors = thermostatUtils
        .sensorItems(thermostat)
        .slice(0, MAX_SENSOR_ITEMS);
      sendState(
        {
          screen: "list",
          listTitle: "Sensors",
          listAction: "REFRESH",
          list: sensors,
        },
        "Unable to load list"
      );
    } else if (action === "THERMOSTATS") {
      sendState({
        screen: "list",
        listTitle: "Thermostats",
        listAction: "SELECT_THERMOSTAT",
        list: list.map(function (item) {
          return { title: item.name, value: item.identifier };
        }),
      });
    } else if (action === "MODES") {
      sendState({
        screen: "list",
        listTitle: "Mode",
        listAction: "SET_MODE",
        list: thermostatUtils.availableModes(thermostat).map(function (mode) {
          return { title: thermostatUtils.modeTitle(mode), value: mode };
        }),
      });
    }
  });
}

function selectThermostat(index) {
  return loadThermostats().then(function (list) {
    if (!list[index]) throw new Error("Thermostat not found");
    patchSettings({ selectedThermostatId: list[index].identifier });
    sendDashboard(list);
  });
}

function setMode(mode) {
  return loadThermostats().then(function (list) {
    var thermostat = thermostatUtils.selectedThermostat(list);
    return postAndRefresh(
      thermostatUtils.createChangeModeRequest(thermostat, mode),
      list
    );
  });
}

function postAndRefresh(body, list) {
  return postThermostat(body)
    .then(bootstrap)
    .catch(function (error) {
      logHttpErrorBody(error);
      sendDashboard(list, "Update failed");
    });
}

function sendDashboard(list, status) {
  var thermostat = thermostatUtils.selectedThermostat(list);
  sendState({
    screen: "dashboard",
    dashboard: thermostatUtils.dashboardFromThermostat(
      thermostat,
      list.length,
      status
    ),
  });
}

function logHttpErrorBody(error) {
  if (!error || !error.responseText) return;
  console.log("http error body: " + error.responseText);
}

function pinInstructions() {
  return (
    'Log into ecobee.com and go to "My Apps" section. ' +
    "Enter the above pin then " +
    "press select button."
  );
}

module.exports = {
  handleCommand: handleCommand,
};
