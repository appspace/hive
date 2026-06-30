var requestJson = require("./http").requestJson;
var settingsModule = require("./settings");
var patchSettings = settingsModule.patchSettings;
var settings = settingsModule.settings;

function getPin() {
  patchSettings({ authPin: null, authCode: null, authExpires: null });

  var data = settings();
  var authUrl =
    data.ecobeeServerUrl +
    "/authorize?response_type=ecobeePin&scope=smartWrite&client_id=" +
    encodeURIComponent(data.clientId);

  return requestJson(authUrl).then(function (response) {
    patchSettings({
      authPin: response.ecobeePin,
      authCode: response.code,
      authExpires: Date.now() + response.expires_in * 60 * 1000,
    });
    return response;
  });
}

function authorizePin() {
  var data = settings();
  if (!data.authCode) return Promise.resolve({ paired: false, pending: false });

  var tokenUrl =
    data.ecobeeServerUrl +
    data.ecobeeTokenApi +
    "?grant_type=ecobeePin&client_id=" +
    encodeURIComponent(data.clientId) +
    "&code=" +
    encodeURIComponent(data.authCode);

  return requestJson(tokenUrl, { method: "POST" })
    .then(function (response) {
      saveToken(response);
      patchSettings({
        authPin: null,
        authCode: null,
        authExpires: null,
        paired: true,
      });
      return { paired: true, pending: false };
    })
    .catch(function (error) {
      if (error.payload && error.payload.error === "authorization_pending") {
        return { paired: false, pending: true };
      }
      throw error;
    });
}

function getAccessToken() {
  var data = settings();
  if (
    data.oauthToken &&
    data.oauthTokenExpires &&
    Date.now() <= data.oauthTokenExpires - 5000
  ) {
    return Promise.resolve(data.oauthToken);
  }

  if (!data.refreshToken) {
    patchSettings({ paired: false });
    var error = new Error("Ecobee account is not paired");
    error.needsPairing = true;
    return Promise.reject(error);
  }

  var tokenUrl =
    data.ecobeeServerUrl +
    data.ecobeeTokenApi +
    "?grant_type=refresh_token&client_id=" +
    encodeURIComponent(data.clientId) +
    "&refresh_token=" +
    encodeURIComponent(data.refreshToken);

  return refreshAccessToken(tokenUrl, 3);
}

function refreshAccessToken(tokenUrl, retriesRemaining) {
  return requestJson(tokenUrl, { method: "POST" })
    .then(function (response) {
      if (!response.access_token) {
        throw new Error("Access token refresh did not return an access token");
      }
      saveToken(response);
      return response.access_token;
    })
    .catch(function (error) {
      if (error && error.status === 401) {
        patchSettings({
          paired: false,
          refreshToken: null,
          oauthToken: null,
          oauthTokenExpires: null,
        });
        error.needsPairing = true;
        throw error;
      }

      if (retriesRemaining > 0) {
        console.log(
          "access token refresh failed, retrying: " +
            (error && error.message ? error.message : JSON.stringify(error))
        );
        return delay(1000).then(function () {
          return refreshAccessToken(tokenUrl, retriesRemaining - 1);
        });
      }

      throw error || new Error("Access token refresh failed");
    });
}

function delay(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

function saveToken(response) {
  patchSettings({
    refreshToken: response.refresh_token,
    oauthToken: response.access_token,
    oauthTokenExpires: Date.now() + response.expires_in * 1000,
  });
}

module.exports = {
  getPin: getPin,
  authorizePin: authorizePin,
  getAccessToken: getAccessToken,
};
