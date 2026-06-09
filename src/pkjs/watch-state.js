var MAX_LIST_ITEMS = 20;

function sendState(state, fallbackError) {
  Pebble.sendAppMessage(
    statePayload(state),
    function () {},
    function (error) {
      console.log("send state failed: " + JSON.stringify(error));
      sendError(fallbackError || "Unable to update watch");
    }
  );
}

function statePayload(state) {
  var payload = {
    SCREEN: state.screen || "loading",
  };

  addString(payload, "TITLE", state.title);
  addString(payload, "BODY", state.body);

  if (state.screen === "pin" && state.pin) {
    addString(payload, "PIN", state.pin.pin);
    addString(payload, "BODY", state.pin.body);
    addString(payload, "STATUS", state.pin.status);
  }

  if (state.screen === "dashboard" && state.dashboard) {
    addDashboard(payload, state.dashboard);
  }

  if (state.screen === "list") {
    addString(payload, "LIST_TITLE", state.listTitle);
    addString(payload, "LIST_ACTION", state.listAction);
    addList(payload, state.list || []);
  }

  return payload;
}

function addDashboard(payload, dashboard) {
  addString(payload, "NAME", dashboard.name);
  addString(payload, "TEMPERATURE", dashboard.temperature);
  addString(payload, "HUMIDITY", dashboard.humidity);
  addString(payload, "DESIRED_TEMPERATURE", dashboard.desiredTemperature);
  addString(payload, "HEAT_HOLD", dashboard.heatHold);
  addString(payload, "COOL_HOLD", dashboard.coolHold);
  addString(payload, "MODE_COLOR", dashboard.modeColor);
  addString(payload, "STATUS", dashboard.status);
  payload.HOLD = dashboard.hold ? 1 : 0;
  payload.HAS_HOLD = dashboard.hasHold ? 1 : 0;
  payload.HAS_SENSORS = dashboard.hasSensors ? 1 : 0;
  payload.THERMOSTAT_COUNT = dashboard.thermostatCount || 0;
}

function addList(payload, list) {
  var count = Math.min(list.length, MAX_LIST_ITEMS);
  payload.LIST_COUNT = count;

  for (var i = 0; i < count; i++) {
    addString(payload, "ITEM_" + i + "_TITLE", list[i].title);
    addString(payload, "ITEM_" + i + "_SUBTITLE", list[i].subtitle);
    addString(payload, "ITEM_" + i + "_VALUE", list[i].value);
  }
}

function addString(payload, key, value) {
  if (value !== undefined && value !== null) payload[key] = String(value);
}

function sendError(error) {
  const message =
    error && error.message
      ? error.message
      : typeof error === "string"
        ? error
        : JSON.stringify(error);
  console.log("error: " + message);
  Pebble.sendAppMessage(
    { ERROR: message || "Unknown error" },
    function () {},
    function (error) {
      console.log("send error failed: " + JSON.stringify(error));
    }
  );
}

module.exports = {
  sendState,
  sendError,
};
