var UI = require('ui');
var ecobeeApi = require('ecobee-api');
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
          var sensorName = sensor.name;
          var occupied;
          if (sensorName.length>11) {
            sensorName = sensorName.substring(0, 11);
          }
          for (var idx in sensor.capability) {
            var cap = sensor.capability[idx];
            if (cap.type==='temperature') {
              if (thermostat.settings.useCelsius) {
                sensorName = sensorName + ' ' + Utils.canonicalToCelsius(cap.value).toPrecision(3)+'\u00B0';
              } else {
                sensorName = sensorName + ' ' +Utils.canonicalToFahrenheit(cap.value).toPrecision(3)+'\u00B0';
              }
            }
            if(cap.type==='occupancy'){
              occupied = cap.value === 'true' ? 'Occupied' : 'Unoccupied';
            }
          }
          menuItems.push({
            title: sensorName,
            subtitle: occupied,
            type: sensor.type
          });
      }
  );
  
  menuItems = menuItems.sort(function(a,b){
    if(a.type === 'thermostat'){
      return -1;
    }
    else if (b.type === 'thermostat'){
      return 1;
    }
    else{
      return a.title.toUpperCase() > b.title.toUpperCase() ? 1 : -1;
    }
  });

  menu = new UI.Menu({
    backgroundColor: '#555555',
    textColor: 'white',
    highlightBackgroundColor: 'black',
    highlightTextColor: '#AAFF00',
    sections: [{
      items: menuItems
    }]
  });
  menu.show();
};

this.exports = {
  show: function(thermostat) {
    if (menu) {
      menu.hide();
      menu = null;
    }
    var menuItems = [];
    var hasHold = Utils.hasHold(thermostat);
    var hasSensors = Utils.hasSensors(thermostat);
    if (hasSensors) {
      menuItems.push({title: 'Sensors'});
    }
    if (hasHold) {
      menuItems.push({ title: 'Resume Program' });
    } 
    menuItems.push({ title: 'Home and Hold' });
    menuItems.push({ title: 'Away and Hold'});
    menuItems.push({ title: 'Sleep and Hold'});
    menu = new UI.Menu({
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