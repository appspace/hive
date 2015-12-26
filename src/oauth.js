var ajax = require('ajax');
var Vibe = require('ui/vibe');
var Settings = require('settings');
var UI = require('ui');
var ErrorWindow = require('error-window');

var doGetAccessToken = function(asyncReq) {
    var oauthTokenExpires = Settings.data('oauthTokenExpires');
    var refreshToken = Settings.data('refreshToken');
    var oauthToken = Settings.data('oauthToken');
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
            async: asyncReq,
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
            ErrorWindow.show(error.error_description);
          }
      );
      } else {
        return Settings.data('oauthToken');
    }
};

var authPin = function(pin, code, onSuccess) {
  var card = new UI.Card();
  var successCallback = onSuccess;
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
            this.successCallback();
          },
          function(error) {
            console.log('Error receiving AUTH data: '+JSON.stringify(error));
            if (error.error === "authorization_pending") {
              card.hide();
              this.authorizePin(pin, code);
            } else {
              ErrorWindow.show();
              card = new UI.Card(error.error_description);
            }
          }
        );
      });
};

var doGetPin = function() {
    Settings.data('authPin', null);
    Settings.data('authCode', null);
    Settings.data('authExpires', null);
    var card = new UI.Card();
    card.title('Authorization');
    card.body('Calling ecobee for authorization. Please wait.');
    card.show();
    var authUrl = Settings.data('ecobeeServerUrl')+
        '/authorize?response_type=ecobeePin&scope=smartWrite&client_id='+
        Settings.data('clientId');
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
          authPin(data.ecobeePin, data.code);
        },
        function(error) {
          console.log('Error receiving AUTH data: '+JSON.stringify(error));
          card.hide();
          ErrorWindow.show('Unable to contact ecobee. Try again later.');
        }
    );
};

this.exports = {
  getAccessToken: function(asyncReq) {
    return doGetAccessToken(asyncReq);
  },
  
  getPin: function() {
    doGetPin();
  },
  authorizePin: function(pin, code) {
    authPin(pin, code);  
  }

};