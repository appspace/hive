var ajax = require('ajax');
var Vibe = require('ui/vibe');
var Settings = require('settings');
var UI = require('ui');
var Vector2 = require('vector2');
var Oauth = require('oauth');

var defaultSettings = {
  ecobeeServerUrl: 'https://api.ecobee.com', 
  ecobeeTokenApi: '/token',
  ecobeeApiEndpoint: '/1/thermostat',
  paired: false, 
  refreshToken: null, 
  oauthToken: null, 
  oauthTokenExpires: null,
  authPin: null,
  authCode: null,
  authExpires: null,
  clientId: 'ABC123' 
};

var mainWindow = new UI.Window();

var background = new UI.Rect({
  position: new Vector2(10, 20),
  size: new Vector2(124, 60),
  backgroundColor: 'white'
});

var temperatureText = new UI.Text({
  position: new Vector2(0, 25),
  size: new Vector2(144, 30),
  text: 'Loading...',
  font: 'gothic-18-bold',
  color: 'black',
  textAlign: 'center'
});

mainWindow.add(background);
mainWindow.add(temperatureText);
mainWindow.setText = function(text) {
  temperatureText.text(text);
};

var initialCheck = function() {
  var data = Settings.data();
  //if (true) {
  if (Object.keys(data).length===0) {
    Settings.data(defaultSettings);
    data = Settings.data();
  }
  console.log('Settings: '+JSON.stringify(data));

  var isPaired = Settings.data('paired');
  if (isPaired) {
    Oauth.getAccessToken(false);  //Pre-fetch token if expired
    mainWindow.show();
  } else {
    var pinExpiration = Settings.data('authExpires');
    console.log('Pin expiration: '+pinExpiration);
    if (!pinExpiration) {
      Oauth.getPin();
    } else if (Date.now() > pinExpiration-5000) {
      Oauth.getPin();
    } else {
      var pin = Settings.data('authPin');
      var code = Settings.data('authCode');
      Oauth.authorizePin(pin,  code);
    }
  }
};

initialCheck();

mainWindow.on('click', 'select', function(event) {
  console.log('Click event on mid button');
  mainWindow.setText('Loading...');
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
          mainWindow.setText(data.status.message);
        } else if (data.thermostatList.length===0) {
          mainWindow.setText('No thermostats');
        } else {
          var temp = data.thermostatList[0].name;
          mainWindow.setText(temp);
        }
      },
      function(error) {
        console.log('Error receiving ecobee data: '+JSON.stringify(error));
        mainWindow.setText('Error');
      }
  );

});