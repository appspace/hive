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
      console.log('Succesfully resumed program!');
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
      console.log('Succesfully set home hold!');
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
      console.log('Succesfully set away hold!');
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
      console.log('Succesfully set sleep hold!');
      if (menu) menu.hide();
    }, 
    function(error) {
      console.log('error setting sleep hold: '+error);
    });
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
    if (hasHold) {
      menuItems.push({ title: 'Resume Program' });
    } 
//    if (hasSensors) {
 //     menuItems.push({title: 'Sensors'});
 //   } 
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
        }
      }
    });
    menu.show();
  }
};