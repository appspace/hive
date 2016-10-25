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
  },
  bgHeatDots : function() {
    var dots = [];
    var heatColor = Feature.color('#FF5500', 'white');
    
    for(var x = 0; x < 9; x++){
      dots.push(new UI.Circle({
        backgroundColor: 'white',
        position: new Vector2(132, (8.5*x) +2),
        radius: (x+1)/3.2
      }));
    }
    
    for(var i = 8; i >= 0; i--){
      dots.push(new UI.Circle({
        backgroundColor: heatColor,
        position: new Vector2(132, (165 - (i*8.5))),
        radius: (i+1)/3.2
      }));
    }
    
    return dots;
  },
  bgCoolDots : function() {
    var dots = [];
    var coolColor = Feature.color('#00AAFF', 'white');
    
    for(var x = 0; x < 9; x++){
      dots.push(new UI.Circle({
        backgroundColor: coolColor,
        position: new Vector2(132, (8.5*x) +2),
        radius: (x+1)/3.2
      }));
    }
    
    for(var i = 8; i >= 0; i--){
      dots.push(new UI.Circle({
        backgroundColor: 'white',
        position: new Vector2(132, (165 - (i*8.5))),
        radius: (i+1)/3.2
      }));
    }
    
    return dots;
  },
  bgAutoDots : function(){
    var dots = [];
    var coolColor = Feature.color('#00AAFF', 'white');
    var heatColor = Feature.color('#FF5500', 'white');
    
    for(var x = 0; x < 7; x++){
      dots.push(new UI.Circle({
        backgroundColor: coolColor,
        position: new Vector2(132, (8.5*x) +2),
        radius: (x+1)/2.9
      }));
    }
    
    for(var n = 0; n < 2; n++){
      dots.push(new UI.Circle({
        backgroundColor: 'white',
        position: new Vector2(132, 78 + (8.5*n)),
        radius: 2.8
      }));
    }
    
    for(var i = 6; i >= 0; i--){
      dots.push(new UI.Circle({
        backgroundColor: heatColor,
        position: new Vector2(132, (165 - (i*8.5))),
        radius: (i+1)/2.5
      }));
    }
    
    return dots;
  }
};