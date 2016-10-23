this.exports = {

  canonicalToFahrenheit: function(canonical) {
    return canonical/10;
  },
  
  canonicalToCelsius: function(canonical) {
    var result = Math.round(2*(canonical/10-32)*5/9)/2;
    //console.log('Converted canonical '+canonical+' to '+result+'C');
    return result;
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
                  "holdType": "indefinite", 
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
              "holdType":"nextTransition",
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
              "holdType":"nextTransition",
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
              "holdType":"nextTransition",
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
  
  hasHold: function(thermostat) {
    if (thermostat.events && thermostat.events.length > 0) 
		{
			var runningEvent = thermostat.events[0];
      console.log('Running event: '+JSON.stringify(runningEvent));
			if (runningEvent.type === 'hold' && runningEvent.running) {
        return true;
      }
    }
    return false;
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