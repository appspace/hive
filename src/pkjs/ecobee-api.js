var THERMOSTAT_QUERY = require("./constants").THERMOSTAT_QUERY;
var requestJson = require("./http").requestJson;
var getAccessToken = require("./oauth").getAccessToken;
var settings = require("./settings").settings;

var cache = null;
var cacheExpiration = 0;

function loadThermostats() {
  if (cache && Date.now() <= cacheExpiration) return Promise.resolve(cache);

  return getAccessToken()
    .then(function (token) {
      var data = settings();
      var callUrl =
        data.ecobeeServerUrl +
        data.ecobeeApiEndpoint +
        "?json=" +
        encodeURIComponent(JSON.stringify(THERMOSTAT_QUERY));

      return requestJson(callUrl, {
        method: "GET",
        headers: authHeaders(token),
      });
    })
    .then(function (response) {
      if (response.status && response.status.code !== 0)
        throw new Error(response.status.message);
      if (!response.thermostatList || response.thermostatList.length === 0)
        throw new Error("No thermostats linked");

      cache = response.thermostatList;
      cacheExpiration = Date.now() + 30000;
      return cache;
    });
}

function postThermostat(body) {
  cache = null;
  return getAccessToken()
    .then(function (token) {
      var data = settings();
      var callUrl =
        data.ecobeeServerUrl + data.ecobeeApiEndpoint + "?format=json";

      return requestJson(callUrl, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify(body),
      });
    })
    .then(function (response) {
      if (response.status && response.status.code !== 0)
        throw new Error(response.status.message);
    });
}

function authHeaders(token) {
  return {
    "Content-Type": "application/json;charset=UTF-8",
    Authorization: "Bearer " + token,
  };
}

module.exports = {
  loadThermostats: loadThermostats,
  postThermostat: postThermostat,
};
