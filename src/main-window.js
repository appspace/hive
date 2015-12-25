var UI = require('ui');
var Vector2 = require('vector2');
var Settings = require('settings');
var Oauth = require('oauth');
var ajax = require('ajax');

var mainWindow;

if (Pebble.getActiveWatchInfo().platform==='aplite') {
//if (true) {  //Uncomment to test aplite on pebble color
  mainWindow = new UI.Window({
    action: {
      up: 'images/up-bw.png',
      select: 'images/menu-bw.png',
      down: 'images/down-bw.png', 
      backgroundColor: 'white'
    }
  });  
} else {
  mainWindow = new UI.Window({
    action: {
      up: 'images/up-color.png',
      select: 'images/menu-color.png',
      down: 'images/down-color.png', 
      backgroundColor: 'white'
    }
  });  
}

/*
var background = new UI.Rect({
  position: new Vector2(10, 20),
  size: new Vector2(124, 60),
  backgroundColor: 'black'
});
*/

var nameText = new UI.Text({
  position: new Vector2(0, 0),
  size: new Vector2(120, 20),
  text: 'Loading...',
  font: 'gothic-18-bold',
  color: 'white',
  textAlign: 'left'
});

var temperatureText = new UI.Text({
  position: new Vector2(0, 40),
  size: new Vector2(120, 40),
  text: 'Loading...',
  font: 'gothic-28-bold',
  color: 'white',
  textAlign: 'center'
});

//mainWindow.add(background);
mainWindow.add(nameText);
mainWindow.add(temperatureText);
mainWindow.setTstatName = function(text) {
  nameText.text(text);  
};
mainWindow.setTemperature = function(canonical) {
  var celsius = (canonical/10-32)*5/9;
  temperatureText.text(celsius.toPrecision(3));
};

mainWindow.on('click', 'select', function(event) {
  console.log('Click event on mid button');
  mainWindow.setTstatName('Loading...');
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
          mainWindow.setTstatName(data.status.message);
        } else if (data.thermostatList.length===0) {
          mainWindow.setTstatName('N/A');
        } else {
          var name = data.thermostatList[0].name;
          mainWindow.setTstatName(name);
          mainWindow.setTemperature(data.thermostatList[0].runtime.actualTemperature);
        }
      },
      function(error) {
        console.log('Error receiving ecobee data: '+JSON.stringify(error));
        mainWindow.setTstatName('Error');
      }
  );
});

this.exports = {
  window: mainWindow, 
  show: function() {
    mainWindow.show();
  }
};