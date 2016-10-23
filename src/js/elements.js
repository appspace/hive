var UI = require('ui');
var Vector2 = require('vector2');
var Feature = require('platform/feature');

this.exports = {
  holdTempHeat : function(heatHold, pos) {
    return new UI.Text({
      //position: new Vector2(118, 72),
      position: pos, 
      size: new Vector2(28, 20),
      color: Feature.color('#FF5500', 'white'),
      text: heatHold,
      font: 'gothic-18',
      textAlign: 'center'    
    });
  }, 
  holdTempCool : function(coolHold, pos) {
    return new UI.Text({
      //position: new Vector2(118, 72),
      position: pos, 
      size: new Vector2(28, 20),
      color: Feature.color('#00AAFF', 'white'),
      text: coolHold,
      font: 'gothic-18',
      textAlign: 'center'    
    });
  }
};