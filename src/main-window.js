var UI = require('ui');
var Vector2 = require('vector2');
var Settings = require('settings');
var ecobeeApi = require('ecobee-api');
var ErrorWindow = require('error-window');

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
  text: '...',
  font: 'bitham-42-bold',
  color: 'white',
  textAlign: 'center'
});

mainWindow.add(nameText);
mainWindow.add(temperatureText);
mainWindow.setTstatName = function(text) {
  nameText.text(text);  
};
mainWindow.setTemperature = function(canonical) {
  var celsius = (canonical/10-32)*5/9;
  temperatureText.text(celsius.toPrecision(3));
};

//mainWindow.on('click', 'select', function(event) {
mainWindow.on('show', function(event) {
  console.log('Show event on main winow');
  mainWindow.setTstatName('Loading...');
  ecobeeApi.loadThermostat(null, 
      function(thermostat) {
            var name = thermostat.name;
            mainWindow.setTstatName(name);
            mainWindow.setTemperature(thermostat.runtime.actualTemperature);
      }, 
      function(error) {
            ErrorWindow.show('Cannot load thermostat data');
      });
});

this.exports = {
  window: mainWindow, 
  show: function() {
    mainWindow.show();
  }
};