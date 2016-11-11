var UI = require('ui');
var Settings = require('settings');
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

  var sensorMenu = new UI.Menu({
    backgroundColor: '#555555',
    textColor: 'white',
    highlightBackgroundColor: 'black',
    highlightTextColor: '#AAFF00',
    sections: [{
      items: menuItems
    }]
  });
  sensorMenu.show();
};

var showThermostatsMenu = function(thermostatList){
  var menuItems = [];
  
  thermostatList.forEach(
    function(thermostat){
      menuItems.push({
        title: thermostat.name,
        thermostatId: thermostat.identifier
      });
    }
  );
  
  var thermostatMenu = new UI.Menu({
    backgroundColor: '#555555',
    textColor: 'white',
    highlightBackgroundColor: 'black',
    highlightTextColor: '#AAFF00',
    sections: [{
      items: menuItems
    }]
  });
  
  thermostatMenu.on('select', function(e) {
    Settings.data('selectedThermostatId', e.item.thermostatId);
    thermostatMenu.hide();
    if (menu) menu.hide();
  });
  
  thermostatMenu.show();
};

var showHvacModeMenu = function(thermostat){
  var menuItems = [];
  
  if(Utils.hasHeatMode(thermostat)){
    menuItems.push({ title: 'Heat', value: 'heat'});
  }
  if(Utils.hasCoolMode(thermostat)){
    menuItems.push({ title: 'Cool', value: 'cool'});
  }
  if(Utils.hasAutoMode(thermostat)){
    menuItems.push({ title: 'Auto', value: 'auto'});
  }
  if(Utils.hasAuxHeatMode(thermostat)){
    menuItems.push({ title: 'Aux', value: 'auxHeatOnly'});
  }
  menuItems.push({ title: 'Off', value: 'off'});
  
  var hvacModeMenu = new UI.Menu({
    backgroundColor: '#555555',
    textColor: 'white',
    highlightBackgroundColor: 'black',
    highlightTextColor: '#AAFF00',
    sections: [{
      items: menuItems
    }]
  });
  
  hvacModeMenu.on('select', function(e) {
    var postRequest = Utils.createChangeModeRequest(thermostat, e.item.value);
    ecobeeApi.postThermostat(postRequest, 
      function() {
        hvacModeMenu.hide();
        if (menu) menu.hide();
      }, 
      function(error) {
        console.log('error setting hvac mode: '+error);
    });
  });
  
  hvacModeMenu.show();
};

this.exports = {
  show: function(thermostatList) {   
    var thermostat;
    var selectedThermostatId = Settings.data('selectedThermostatId');
    if(selectedThermostatId){
      thermostat = Utils.selectThermostat(selectedThermostatId,thermostatList);
    }
    else{
      thermostat = thermostatList[0];
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
    if(thermostatList.length > 1){
      menuItems.push({title: 'Thermostats'});
    }
    menuItems.push({ title: 'Change Mode'});
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
        } else if (title==='Thermostats') {
          showThermostatsMenu(thermostatList);
        } else if (title==='Change Mode') {
          showHvacModeMenu(thermostat);
        }
      }
    });
    menu.show();
  }
};