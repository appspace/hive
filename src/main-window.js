var UI = require('ui');
var Vector2 = require('vector2');
var ecobeeApi = require('ecobee-api');
var ErrorWindow = require('error-window');
var Accel = require('ui/accel');
var Utils = require('utils');
var Menu = require('menu');
var Elements = require('elements');

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

var modeText = new UI.Text({
  position: new Vector2(0, 22),
  size: new Vector2(144, 18),
  text: 'HEAT',
  font: 'gothic-18',
  color: 'white',
  textAlign: 'center'
});

var humidityIcon = new UI.Image({
  position: new Vector2(46, 44),
  size: new Vector2(20, 20),
  image: 'images/humidity-icon.png'
});

var humidityText = new UI.Text({
  position: new Vector2(66, 42),
  size: new Vector2(74, 18),
  text: '',
  font: 'gothic-18',
  color: 'white',
  textAlign: 'left'
});

var temperatureText = new UI.Text({
  position: new Vector2(0, 60),
  size: new Vector2(144, 40),
  text: '...',
  font: 'bitham-42-bold',
  color: 'white',
  textAlign: 'center'
});

var holdText = new UI.Text({
  position: new Vector2(40, 130),
  size: new Vector2(66, 24),
  borderColor: 'black',
  text: '',
  font: 'gothic-18',
  color: 'white',
  textAlign: 'center'  
});

var heatModeImage;
var holdTemp1;
var holdTemp2;
var myTstat;

mainWindow.add(modeText);
mainWindow.add(nameText);
mainWindow.add(humidityIcon);
mainWindow.add(humidityText);
mainWindow.add(temperatureText);
mainWindow.add(holdText);

mainWindow.setTstatName = function(text) {
  nameText.text(text);  
};
mainWindow.setTemperature = function(thermostat) {
  var canonical = thermostat.runtime.actualTemperature;
  if (thermostat.settings.useCelsius) {
    temperatureText.text(Utils.canonicalToCelsius(canonical).toPrecision(3));
  } else {
    temperatureText.text(Utils.canonicalToFahrenheit(canonical).toPrecision(2));
  }
};
mainWindow.setHumidity = function(percentage) {
  humidityText.text(percentage+'%');
};

mainWindow.displayHold = function(thermostat) {
  var hasHold = Utils.hasHold(thermostat);
  if (hasHold) {
    holdText.borderColor('white');
    holdText.text('Hold');
  } else {
    holdText.text('');
    holdText.borderColor('black');
  }
};

mainWindow.setHeatMode = function(thermostat) {
  if (holdTemp1) holdTemp1.remove();
  if (holdTemp2) holdTemp2.remove();
  holdTemp1 = undefined;
  holdTemp2 = undefined;
  var hvacMode = thermostat.settings.hvacMode;
  console.log('HVac mode: '+hvacMode);
  var imageName;
  var heatHold;
  var coolHold;
  if (hvacMode==='heat' || hvacMode==='auxHeatOnly') {
    modeText.text('HEAT');
    imageName = 'images/bg-heat.png';
    if (thermostat.settings.useCelsius) {
      heatHold = Utils.canonicalToCelsius(thermostat.runtime.desiredHeat).toPrecision(3);
    } else {
      heatHold = Utils.canonicalToFahrenheit(thermostat.runtime.desiredHeat).toPrecision(2);
    }
    holdTemp1 = Elements.holdTempHeat(heatHold, new Vector2(118, 72));
  } else if (hvacMode==='cool') {
    modeText.text('COOL');
    imageName = 'images/bg-cool.png';
    if (thermostat.settings.useCelsius) {
      coolHold = Utils.canonicalToCelsius(thermostat.runtime.desiredCool).toPrecision(3);
    } else {
      coolHold = Utils.canonicalToFahrenheit(thermostat.runtime.desiredCool).toPrecision(2);
    }
    holdTemp1 = Elements.holdTempCool(coolHold, new Vector2(118, 72));
  } else if (hvacMode==='auto') {
    modeText.text('AUTO');
    imageName = 'images/bg-auto.png';
    if (thermostat.settings.useCelsius) {
      coolHold = Utils.canonicalToCelsius(thermostat.runtime.desiredCool).toPrecision(3);
      heatHold = Utils.canonicalToCelsius(thermostat.runtime.desiredHeat).toPrecision(3);
    } else {
      coolHold = Utils.canonicalToFahrenheit(thermostat.runtime.desiredCool).toPrecision(2);
      heatHold = Utils.canonicalToFahrenheit(thermostat.runtime.desiredHeat).toPrecision(2);
    }
    holdTemp1 = Elements.holdTempCool(coolHold, new Vector2(118, 54));
    holdTemp2 = Elements.holdTempHeat(heatHold, new Vector2(118, 87));
  } else {
    modeText.text('OFF');
  }
  if (heatModeImage && heatModeImage.image!=imageName) {
    console.log('removing old image');
    heatModeImage.remove();
    heatModeImage = undefined;
  }
  if (!imageName && heatModeImage) {
    heatModeImage.remove();
    heatModeImage = undefined;
  }
  if (imageName) {
    heatModeImage = new UI.Image({
      position: new Vector2(126, 0),
      size: new Vector2(18, 168),
      image: imageName
    });
  }
  if (heatModeImage) mainWindow.add(heatModeImage);
  if (holdTemp1) mainWindow.add(holdTemp1);
  if (holdTemp2) mainWindow.add(holdTemp2);
};

var refreshData = function() {
  ecobeeApi.loadThermostat(null, 
      function(thermostat) {
        myTstat = thermostat;
        mainWindow.setTstatName(myTstat.name);
        mainWindow.setTemperature(myTstat);
        mainWindow.setHumidity(myTstat.runtime.actualHumidity);
        mainWindow.setHeatMode(myTstat);
        mainWindow.displayHold(myTstat);
      }, 
      function(error) {
        ErrorWindow.show('Cannot load thermostat data');
      });
};

mainWindow.on('click', 'select', function(event) {
  refreshData();
});

var changeTemperature = function(delta) {
  var hvacMode = myTstat.settings.hvacMode;
  var newHeatHold = myTstat.runtime.desiredHeat+delta;
  var newCoolHold = myTstat.runtime.desiredCool+delta;
  if (hvacMode==='heat' || hvacMode==='auxHeatOnly' || hvacMode==='auto') {
    if (newHeatHold > myTstat.settings.heatRangeHigh || 
        newHeatHold < myTstat.settings.heatRangeLow) {
      return;
    }
  } else if (hvacMode==='cool' || hvacMode==='auto') {
    if (newCoolHold > myTstat.settings.coolRangeHigh || 
        newCoolHold < myTstat.settings.coolRangeLow) {
      return;
    }
  }
  var postRequest = Utils.createTemperatureHoldEvent(myTstat, newHeatHold, newCoolHold);
  ecobeeApi.postThermostat(postRequest, 
                          function() {
                            console.log('success!');
                            refreshData();
                          }, 
                          function(error) {
                            console.log('error: '+error);
                          });
};

function animateHoldTempText(delta) {
    if (holdTemp1) {
    var pos = holdTemp1.position();
    var originalPosition = pos.y;
    pos.y = pos.y + delta;
    holdTemp1.animate('position', pos, 200);  
    holdTemp1.queue(function(next) {
      pos = this.position();
      pos.y = originalPosition;
      this.animate('position', pos, 100);
      next();
    });
  }
  if (holdTemp2) {
    var pos2 = holdTemp2.position();
    var originalPosition2 = pos2.y;
    pos2.y = pos2.y + delta;
    holdTemp2.animate('position', pos2, 200);
    holdTemp2.queue(function(next) {
      pos2 = this.position();
      pos2.y = originalPosition2;
      this.animate('position', pos2, 100);
      next();
    });
  }
}

mainWindow.on('click', 'up', function(event) { 
  animateHoldTempText(-20);
  changeTemperature(20);
});

mainWindow.on('click', 'down', function(event) {
  animateHoldTempText(20);
  changeTemperature(-20);
});

mainWindow.on('click', 'select', function(event) {
  Menu.show(myTstat);
});

mainWindow.on('show', function(event) {
  console.log('Show event on main winow');
  ecobeeApi.loadThermostat(null, 
      function(thermostat) {
            myTstat = thermostat;
            mainWindow.setTstatName(myTstat.name);
            mainWindow.setTemperature(myTstat);
            mainWindow.setHumidity(myTstat.runtime.actualHumidity);
            mainWindow.setHeatMode(myTstat);
            mainWindow.displayHold(myTstat);
            Accel.init();
            mainWindow.on('accelTap', function(e) {
              refreshData();
            });
      }, 
      function(error) {
            ErrorWindow.show('Cannot load thermostat data');
      });
});

mainWindow.on('hide', function(event) {
  console.log('Hiding main window');
});

this.exports = {
  window: mainWindow, 
  show: function() {
    mainWindow.show();
  }
};