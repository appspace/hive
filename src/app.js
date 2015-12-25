var Settings = require('settings');
var Oauth = require('oauth');
var MainWindow = require('main-window');

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

var initialCheck = function() {
  console.log('Platform: '+JSON.stringify(Pebble.getActiveWatchInfo()));
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
    MainWindow.show();
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
