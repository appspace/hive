this.exports = {

  canonicalToFahrenheit: function(canonical) {
    return canonical/10;
  },
  
  canonicalToCelsius: function(canonical) {
    var result = Math.round(2*(canonical/10-32)*5/9)/2;
    //console.log('Converted canonical '+canonical+' to '+result+'C');
    return result;
  },
  
  calculateHoldType: function(thermostatSettings){
    switch(thermostatSettings.holdAction){
      case 'nextPeriod':
        return 'nextTransition';
      case 'useEndTime4hour':
        return 'holdHours';
      case 'useEndTime2hour':
        return 'holdHours';
      default:
        return 'indefinite';
    } 
  },
  
  calculateHoldHours: function(thermostatSettings){
    switch(thermostatSettings.holdAction){
      case 'useEndTime4hour':
        return 4;
      case 'useEndTime2hour':
        return 2;
      default:
        return null;
    } 
  },
  
  createTemperatureHoldEvent: function(thermostat, newHeat, newCold) {
    return {
        "selection": {
            "selectionType": "thermostats",
            "selectionMatch": thermostat.identifier
            },
        "functions": [
            {
                "type": "setHold",
                "params": {
                  "holdType": this.calculateHoldType(thermostat.settings), 
                  "holdHours": this.calculateHoldHours(thermostat.settings),
                  "coolHoldTemp": newCold, 
                  "heatHoldTemp": newHeat
                }
            }
        ]
    };
  }, 
  
  createAwayHoldEvent: function(thermostat) {
    return {
      "selection": {
            "selectionType": "thermostats",
            "selectionMatch": thermostat.identifier
          },
          "functions": [{
            "type":"setHold",
            "params":{
              "holdType": "indefinite",
              "holdClimateRef":"away"
            }
          }]
    };
  },

  createHomeHoldEvent: function(thermostat) {
    return {
      "selection": {
            "selectionType": "thermostats",
            "selectionMatch": thermostat.identifier
          },
          "functions": [{
            "type":"setHold",
            "params":{
              "holdType": "indefinite",
              "holdClimateRef":"home"
            }
          }]
    };
  },
  
    createSleepHoldEvent: function(thermostat) {
    return {
      "selection": {
            "selectionType": "thermostats",
            "selectionMatch": thermostat.identifier
          },
          "functions": [{
            "type":"setHold",
            "params":{
              "holdType": "indefinite",
              "holdClimateRef":"sleep"
            }
          }]
    };
  },
  
  createResumeProgramEvent: function(thermostat) {
    return {
        "selection": {
            "selectionType": "thermostats",
            "selectionMatch": thermostat.identifier
            },
        "functions": [
            {
                "type": "resumeProgram",
                "params": {
                  'resumeAll': true
                }
            }
        ]
    };
  },
  
  createChangeModeRequest: function(thermostat, newMode){
     return {
        "selection": {
            "selectionType": "thermostats",
            "selectionMatch": thermostat.identifier
            },
        "thermostat": {
          "settings": {
            "hvacMode": newMode
          }
        }
    };
  },
  
  hasHold: function(thermostat) {
    if (thermostat.events && thermostat.events.length > 0) 
		{
			var runningEvent = thermostat.events[0];
      console.log('Running event: '+JSON.stringify(runningEvent));
			if ((runningEvent.type === 'hold' || runningEvent.type === 'autoAway' || runningEvent.type === 'autoHome' ) && 
          runningEvent.running) {
        return true;
      }
    }
    return false;
  },
  
  hasHeatMode: function(thermostat) {
    return thermostat.settings.heatStages > 0 || thermostat.settings.hasHeatPump;
  },
  
  hasCoolMode: function(thermostat) {
    return thermostat.settings.coolStages > 0 || thermostat.settings.hasHeatPump;
  },
  
  hasAuxHeatMode: function(thermostat) {
    return thermostat.settings.hasHeatPump &&
      (thermostat.settings.hasElectric || thermostat.settings.hasBoiler || thermostat.settings.hasForcedAir);
  },
  
  hasAutoMode: function(thermostat) {
    return thermostat.settings.autoHeatCoolFeatureEnabled && this.hasCoolMode(thermostat) && this.hasHeatMode(thermostat);
  },
  
  hasSensors: function(thermostat) {
    return thermostat.remoteSensors && thermostat.remoteSensors.length;
  },
  
  selectThermostat: function(thermostatId ,thermostatList){
    for (var index = 0; index < thermostatList.length; ++index) {
       if(thermostatList[index].identifier === thermostatId){
         return thermostatList[index];
       }
    }
  }
};