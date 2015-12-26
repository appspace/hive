this.exports = {

  canonicalToFahrenheit: function(canonical) {
    return canonical/10;
  },
  
  canonicalToCelsius: function(canonical) {
    return (canonical/10-32)*5/9;
  }

};