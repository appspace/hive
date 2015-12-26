var UI = require('ui');
var Vector2 = require('vector2');
var ecobeeApi = require('ecobee-api');
var ErrorWindow = require('error-window');

var mainWindow = new UI.Window({
  fullscreen: true, 
  scrollable: false, 
  clear: false
});

var nameText = new UI.Text({
  position: new Vector2(0, 0),
  size: new Vector2(144, 20),
  text: 'Loading...',
  font: 'gothic-18-bold',
  color: 'white',
  textAlign: 'left'
});

var humidityText = new UI.Text({
  position: new Vector2(0, 40),
  size: new Vector2(144, 20),
  text: '',
  font: 'gothic-18',
  color: 'white',
  textAlign: 'center'
});

var temperatureText = new UI.Text({
  position: new Vector2(0, 60),
  size: new Vector2(144, 40),
  text: '...',
  font: 'bitham-42-bold',
  color: 'white',
  textAlign: 'center'
});

var modeImage = new UI.Image({
  position: new Vector2(0, 126),
  size: new Vector2(18, 168),
  image: 'img/bg-heat.png'
});

mainWindow.add(modeImage);
mainWindow.add(nameText);
mainWindow.add(humidityText);
mainWindow.add(temperatureText);
mainWindow.setTstatName = function(text) {
  nameText.text(text);  
};
mainWindow.setTemperature = function(canonical) {
  var celsius = (canonical/10-32)*5/9;
  temperatureText.text(celsius.toPrecision(3));
};
mainWindow.setHumidity = function(percentage) {
  humidityText.text(percentage+'%');
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
            mainWindow.setHumidity(thermostat.runtime.actualHumidity);
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