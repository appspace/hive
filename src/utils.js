this.exports = {

  canonicalToFahrenheit: function(canonical) {
    return canonical/10;
  },
  
  canonicalToCelsius: function(canonical) {
    return (canonical/10-32)*5/9;
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
  
  hasHold: function(thermostat) {
    if (thermostat.events && thermostat.events.length > 0) 
		{
			var runningEvent = thermostat.events[0];
      console.log('Running event: '+JSON.stringify(runningEvent));
			if (runningEvent.type === 'hold' && runningEvent.running) {
        console.log('This is a hold event!');
        return true;
      }
    }
    console.log('This is NOT a hold event');
    return false;
  }
};