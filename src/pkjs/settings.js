const { DEFAULT_SETTINGS } = require("./constants");

const SETTINGS_PREFIX = "hive.settings.";
const STORED_KEYS = [
  "paired",
  "refreshToken",
  "oauthToken",
  "oauthTokenExpires",
  "authPin",
  "authCode",
  "authExpires",
  "selectedThermostatId",
];

function ensureSettings() {
  readSettings();
}

function settings() {
  return Object.assign({}, DEFAULT_SETTINGS, readSettings());
}

function patchSettings(update) {
  writeSettings(Object.assign(readSettings(), update));
}

function readSettings() {
  const stored = {};
  STORED_KEYS.forEach(function (key) {
    const raw = localStorage.getItem(SETTINGS_PREFIX + key);
    if (raw === null || raw === undefined) return;
    try {
      stored[key] = JSON.parse(raw);
    } catch (error) {
      console.log("setting " + key + " read failed: " + error);
    }
  });
  return stored;
}

function writeSettings(nextSettings) {
  STORED_KEYS.forEach(function (key) {
    if (!Object.prototype.hasOwnProperty.call(nextSettings, key)) return;

    const value = nextSettings[key];
    if (value === null || value === undefined) removeSetting(key);
    else localStorage.setItem(SETTINGS_PREFIX + key, JSON.stringify(value));
  });
}

function removeSetting(key) {
  if (localStorage.removeItem) localStorage.removeItem(SETTINGS_PREFIX + key);
  else localStorage.setItem(SETTINGS_PREFIX + key, "null");
}

module.exports = {
  ensureSettings,
  settings,
  patchSettings,
};
