/**
 * Welcome to Pebble.js!
 *
 * This is the app run on pebble watches
 */

var UI = require('ui');
var Vector2 = require('vector2');

var mainWindow = new UI.Window();

var background = new UI.Rect({
  position: new Vector2(10, 20),
  size: new Vector2(124, 60),
  backgroundColor: 'white'
});

var temperatureText = new UI.Text({
  position: new Vector2(0, 25),
  size: new Vector2(144, 30),
  text: 'Nothing yet',
  font: 'gothic-18-bold',
  color: 'black',
  textAlign: 'center'
});

mainWindow.add(background);
mainWindow.add(temperatureText);
mainWindow.show();

Pebble.addEventListener('appmessage', function(e) {
  console.log('Received message: ' + JSON.stringify(e.payload));
});

mainWindow.on('click', 'select', function(event) {
  console.log('Click event on mid button');
  temperatureText.text = 'YUP';
});

/*

main.on('click', 'down', function(e) {
   var card = new UI.Card();
   card.title('A Card');
   card.subtitle('Is a Window');
   card.body('The simplest window type in Pebble.js.');
   card.show();
});

main.on('click', 'select', function(e) {
   var wind = new UI.Window({
   fullscreen: true,
   });
   var textfield = new UI.Text({
   position: new Vector2(0, 65),
   size: new Vector2(144, 30),
   font: 'gothic-24-bold',
   text: 'Text Anywhere!',
   textAlign: 'center'
   });
   wind.add(textfield);
   wind.show();
});

main.on('click', 'up', function(e) {
   var menu = new UI.Menu({
   sections: [{
   items: [{
   title: 'test title',
   icon: 'images/app_logo.png',
   subtitle: 'Can do Menus'
   }, {
   title: 'Second Item',
   subtitle: 'Subtitle Text'
   }]
   }]
   });
   menu.on('select', function(e) {
   console.log('Selected item #' + e.itemIndex + ' of section #' + e.sectionIndex);
   console.log('The item is titled "' + e.item.title + '"');
   });
   menu.show();
});

 */