const { ECOBEE_CLIENT_ID } = require("./generated-config");

const DEFAULT_SETTINGS = {
  ecobeeServerUrl: "https://api.ecobee.com",
  ecobeeTokenApi: "/token",
  ecobeeApiEndpoint: "/1/thermostat",
  paired: false,
  refreshToken: null,
  oauthToken: null,
  oauthTokenExpires: null,
  authPin: null,
  authCode: null,
  authExpires: null,
  selectedThermostatId: null,
  clientId: ECOBEE_CLIENT_ID,
};

const THERMOSTAT_QUERY = {
  selection: {
    includeAlerts: "false",
    selectionType: "registered",
    selectionMatch: "",
    includeEvents: "true",
    includeSettings: "true",
    includeRuntime: "true",
    includeSensors: "true",
  },
};

module.exports = {
  DEFAULT_SETTINGS,
  THERMOSTAT_QUERY,
};
