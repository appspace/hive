var ajax = require('ajax');
var Vibe = require('ui/vibe');
var Settings = require('settings');
var UI = require('ui');
var Vector2 = require('vector2');

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

var authorizePin = function(pin, code) {
  var card = new UI.Card();
  card.title('PIN: '+pin);
  card.body('Log into ecobee.com and go to "My Apps" section.' +
      'Enter the provided pin then '+
      'press select button.');
  card.show();
  card.on('click', 'select', function(e) {
    var tokenUrl =  Settings.data('ecobeeServerUrl') +
        Settings.data('ecobeeTokenApi') +
        '?grant_type=ecobeePin&client_id=' +
        Settings.data('clientId') +
        "&code=" + code;
    console.log('Calling '+tokenUrl);
    ajax(
        {
          url: tokenUrl,
          type: 'json',
          method: 'post'
        },
        function(data) {
          Vibe.vibrate('short');
          console.log('Received AUTH data: '+JSON.stringify(data));
          Settings.data('authPin', null);
          Settings.data('authCode', null);
          Settings.data('authExpires', null);
          Settings.data('paired', true);
          Settings.data('refreshToken', data.refresh_token);
          Settings.data('oauthToken', data.access_token);
          var tokenExpiresIn = Date.now()+data.expires_in*1000;
          console.log('Token '+data.access_token+' will expire at '+tokenExpiresIn);
          Settings.data('oauthTokenExpires', tokenExpiresIn);
          initialCheck();
        },
        function(error) {
          console.log('Error receiving AUTH data: '+JSON.stringify(error));
          if (error.error === "authorization_pending") {
            card.hide();
            authorizePin(pin, code);
          } else {
            card = new UI.Card();
            card.title('Auth Error');
            card.body(error.error_description);
            card.show();
          }
        }
    );
  });
}

var getPin = function() {
  Settings.data('authPin', null);
  Settings.data('authCode', null);
  Settings.data('authExpires', null);
  var card = new UI.Card();
  card.title('Authorization');
  card.body('Calling ecobee for authorization. Please wait.');
  card.show();
  var authUrl = Settings.data('ecobeeServerUrl')
      +'/authorize?response_type=ecobeePin&scope=smartWrite&client_id='
      +Settings.data('clientId');
  ajax(
      {
        url: authUrl,
        type: 'json'
      },
      function(data) {
        Vibe.vibrate('short');
        console.log('Received AUTH data: '+JSON.stringify(data));
        Settings.data('authPin', data.ecobeePin);
        Settings.data('authCode', data.code);
        var expiresAt = Date.now()+data.expires_in*60*1000;
        console.log('Pin will expire at '+expiresAt);
        Settings.data('authExpires', expiresAt);
        card.hide();
        authorizePin(data.ecobeePin, data.code);
      },
      function(error) {
        console.log('Error receiving AUTH data: '+JSON.stringify(error));
        card.hide();
        card = new UI.Card();
        card.title('Auth Error');
        card.body('Unable to contact ecobee. Try again later.');
        card.show();
      }
  );
}

var initialCheck = function() {
  var data = Settings.data();
  //if (true) {
  if (Object.keys(data).length==0) {
    Settings.data(defaultSettings);
    data = Settings.data();
  }
  console.log('Settings: '+JSON.stringify(data));

  var isPaired = Settings.data('paired');
  if (isPaired) {
    mainWindow.show();
  } else {
    var pinExpiration = Settings.data('authExpires');
    console.log('Pin expiration: '+pinExpiration);
    if (!pinExpiration) {
      getPin();
    } else if (Date.now() > pinExpiration-5000) {
      getPin();
    } else {
      var pin = Settings.data('authPin');
      var code = Settings.data('authCode');
      authorizePin(pin,  code);
    }
  }
}

initialCheck();

var getAccessToken = function() {
    var oauthTokenExpires = Settings.data('oauthTokenExpires');
    var refreshToken = Settings.data('refreshToken');
    var oauthTokem = Settings.data('oauthToken');
  console.log('oauth token '+oauthToken+' expires at: '+oauthTokenExpires+'; refresh token: '+refreshToken);
    if (Date.now() > oauthTokenExpires-500) {
      var tokenUrl =  Settings.data('ecobeeServerUrl') +
        Settings.data('ecobeeTokenApi') +
        '?grant_type=refresh_token&client_id=' +
        Settings.data('clientId') +
        "&refresh_token=" + refreshToken;
      console.log('Calling '+tokenUrl);
      ajax(
          {
            url: tokenUrl,
            type: 'json',
            method: 'post'
          },
          function(data) {
            console.log('Received AUTH data: '+JSON.stringify(data));
            Settings.data('refreshToken', data.refresh_token);
            Settings.data('oauthToken', data.access_token);
            var tokenExpiresIn = Date.now()+data.expires_in*1000;
            console.log('Token '+data.access_token+' will expire at '+tokenExpiresIn);
            Settings.data('oauthTokenExpires', tokenExpiresIn);
            return data.access_token;
          },
          function(error) {
            console.log('Error refreshing OAuth token: '+JSON.stringify(error));
            card = new UI.Card();
            card.title('Auth Error');
            card.body(error.error_description);
            card.show();
          }
      );
      } else {
        return Settings.data('oauthToken');
    }
}

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
  var token = getAccessToken();
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
        if (data.status.code!=0) {
          mainWindow.setText(data.status.message);
        } else if (data.thermostatList.length==0) {
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