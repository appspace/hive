var UI = require('ui');
var Vector2 = require('vector2');

this.exports = {
  holdTempHeat : function(heatHold, pos) {
    var col = Pebble.getActiveWatchInfo().platform==='aplite'?'white':'#FF5500';
    return new UI.Text({
      //position: new Vector2(118, 72),
      position: pos, 
      size: new Vector2(28, 20),
      color: col,
      text: heatHold,
      font: 'gothic-18',
      textAlign: 'center'    
    });
  }, 
  holdTempCool : function(coolHold, pos) {
    var col = Pebble.getActiveWatchInfo().platform==='aplite'?'white':'#00AAFF';
    return new UI.Text({
      //position: new Vector2(118, 72),
      position: pos, 
      size: new Vector2(28, 20),
      color: col,
      text: coolHold,
      font: 'gothic-18',
      textAlign: 'center'    
    });
  }
};