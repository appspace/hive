var UI = require('ui');
var Vector2 = require('vector2');
var ecobeeApi = require('ecobee-api');
var ErrorWindow = require('error-window');
var Accel = require('ui/accel');
var Utils = require('utils');

var menu;

var resumeProgram = function(thermostat) {
  var postRequest = Utils.createResumeProgramEvent(thermostat);
  ecobeeApi.postThermostat(postRequest, 
    function() {
      console.log('Successfully resumed program!');
      if (menu) menu.hide();
    }, 
    function(error) {
      console.log('error resuming program: '+error);
    });
};

var homeHold = function(thermostat) {
  var postRequest = Utils.createHomeHoldEvent(thermostat);
  ecobeeApi.postThermostat(postRequest, 
    function() {
      console.log('Successfully set home hold!');
      if (menu) menu.hide();
    }, 
    function(error) {
      console.log('error setting home hold: '+error);
    });
};

var awayHold = function(thermostat) {
  var postRequest = Utils.createAwayHoldEvent(thermostat);
  ecobeeApi.postThermostat(postRequest, 
    function() {
      console.log('Successfully set away hold!');
      if (menu) menu.hide();
    }, 
    function(error) {
      console.log('error setting away hold: '+error);
    });
};

var sleepHold = function(thermostat) {
  var postRequest = Utils.createSleepHoldEvent(thermostat);
  ecobeeApi.postThermostat(postRequest, 
    function() {
      console.log('Successfully set sleep hold!');
      if (menu) menu.hide();
    }, 
    function(error) {
      console.log('error setting sleep hold: '+error);
    });
};

var showSensorsMenu = function(thermostat) {
  if (menu) {
    menu.hide();
    menu = null;
  }
  var menuItems = [];
  thermostat.remoteSensors.forEach(
      function(sensor) {
        menuItems.push({title: 'sensor '+sensor.name});
      }
  );
  menuItems.push({title: 'Sensor 3, 29C'});

  menu = new UI.Menu({
    fullscreen: true,
    backgroundColor: '#555555',
    textColor: 'white',
    highlightBackgroundColor: 'black',
    highlightTextColor: '#AAFF00',
    sections: [{
      items: menuItems
    }]
  });
  menu.show();
}

this.exports = {
  show: function(thermostat) {
    if (menu) {
      menu.hide();
      menu = null;
    }
    var menuItems = [];
    var hasHold = Utils.hasHold(thermostat);
    var hasSensors = Utils.hasSensors(thermostat);
    if (hasHold) {
      menuItems.push({ title: 'Resume Program' });
    } 
    if (hasSensors) {
      menuItems.push({title: 'Sensors'});
    }
    menuItems.push({ title: 'Home and Hold' });
    menuItems.push({ title: 'Away and Hold'});
    menuItems.push({ title: 'Sleep and Hold'});
    menu = new UI.Menu({
      fullscreen: true, 
      backgroundColor: '#555555',
      textColor: 'white',
      highlightBackgroundColor: 'black',
      highlightTextColor: '#AAFF00',
      sections: [{
        items: menuItems
      }]
    });
    menu.on('select', function(e) {
      var title = e.item.title;
      console.log('Selected item "' + title + '"');
      if (title) {
        if (title==='Resume Program') {
          resumeProgram(thermostat);
        } else if (title==='Home and Hold') {
          homeHold(thermostat);
        } else if (title==='Away and Hold') {
          awayHold(thermostat);
        } else if (title==='Sleep and Hold') {
          sleepHold(thermostat);
        } else if (title==='Sensors') {
          showSensorsMenu(thermostat);
        }
      }
    });
    menu.show();
  }
};