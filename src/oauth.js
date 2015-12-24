var ajax = require('ajax');
var Vibe = require('ui/vibe');
var Settings = require('settings');
var UI = require('ui');

this.exports = {
  getAccessToken: function(asyncReq) {
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
            var card = new UI.Card();
            card.title('Auth Error');
            card.body(error.error_description);
            card.show();
          }
      );
      } else {
        return Settings.data('oauthToken');
    }
  },
  
  getPin: function() {
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
          this.authorizePin(data.ecobeePin, data.code);
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
  },

  authorizePin: function(pin, code) {
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
            //initialCheck();
          },
          function(error) {
            console.log('Error receiving AUTH data: '+JSON.stringify(error));
            if (error.error === "authorization_pending") {
              card.hide();
              this.authorizePin(pin, code);
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

};