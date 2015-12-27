var Settings = require('settings');
var Oauth = require('oauth');
var ajax = require('ajax');

var jsonRequest = {
    "selection": {
      "includeAlerts": "false",
      "selectionType": "registered",
      "selectionMatch": "",
      "includeEvents": "true",
      "includeSettings": "true",
      "includeRuntime": "true"
    }
};

var cache;
var cacheExpiration;

this.exports = {
  loadThermostat: function(tstatId, onSuccess, onError) {
    //TODO: Add caching
    if (Date.now()>cacheExpiration) {
      console.log('Cache expired');
      cache = null;
    }
    if (cache && cache!==null) {
      console.log('Data in cache: '+JSON.stringify(cache));
      if (!tstatId || tstatId===cache.identifier) {
        console.log('Returning cached thermostat');
        return cache;
      } 
    }
    var token = Oauth.getAccessToken(false);
    var callUrl = Settings.data('ecobeeServerUrl')+
      Settings.data('ecobeeApiEndpoint')+
      '?json='+encodeURIComponent(JSON.stringify(jsonRequest));
    console.log('GET '+callUrl+' with OAuth token: '+token);
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
            cache = data.thermostatList[0];
            cacheExpiration = Date.now()+30*1000;
            onSuccess(cache);
          }
        },
        function(error) {
          console.log('Error receiving ecobee data: '+JSON.stringify(error));
          onError(error);
        }
    );
  }, 
  postThermostat: function(req, onSuccess, onError) {
    cache = null;  //SO that it refreshes
    var token = Oauth.getAccessToken(false);
    var callUrl = Settings.data('ecobeeServerUrl')+Settings.data('ecobeeApiEndpoint')+'?format=json';
    console.log('POST '+JSON.stringify(req)+' to '+callUrl+' with OAuth token: '+token);
    ajax(
        { 
          url: callUrl, 
          type: 'json', 
          method: 'post',
          headers: {
            'Content-Type': 'application/json;charset=UTF-8',
            'Authorization': 'Bearer '+token
          }, 
          data: req
        },
        function(data) {
          console.log('Received data: '+JSON.stringify(data));
          if (data.status.code!==0) {
            onError(data.status.message);
          } else {
            onSuccess();
          }
        },
        function(error) {
          console.log('Error receiving ecobee data: '+JSON.stringify(error));
          onError(error);
        }
    );
  }
};