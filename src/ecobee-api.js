var Settings = require('settings');
var Oauth = require('oauth');
var ajax = require('ajax');

var jsonRequest = {
    "selection": {
      "includeAlerts": "false",
      "selectionType": "registered",
      "selectionMatch": "",
      "includeEvents": "false",
      "includeSettings": "true",
      "includeRuntime": "true"
    }
};

var callUrl = Settings.data('ecobeeServerUrl')+
  Settings.data('ecobeeApiEndpoint')+
  '?json='+encodeURIComponent(JSON.stringify(jsonRequest));

this.exports = {
  loadThermostat: function(tstatId, onSuccess, onError) {
    //TODO: Add caching
    var token = Oauth.getAccessToken(false);
    console.log('Calling '+callUrl+' with OAuth token: '+token);
    ajax(
        { 
          url: callUrl, 
          type: 'json', 
          method: 'get',
          headers: {
            'Content-Type': 'application/json;charset=UTF-8',
            'Authorization': 'Bearer '+token
          }
        },
        function(data) {
          console.log('Received data: '+JSON.stringify(data));
          if (data.status.code!==0) {
            onError(data.status.message);
          } else if (data.thermostatList.length===0) {
            onError('No thermostats linked to account');
          } else {
            onSuccess(data.thermostatList[0]);
          }
        },
        function(error) {
          console.log('Error receiving ecobee data: '+JSON.stringify(error));
          onError(error);
        }
    );
  }
};