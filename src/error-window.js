var UI = require('ui');

this.exports = {
  show: function(errorText) {
    var card = new UI.Card({
      title: 'Error'
    });
    card.body(errorText);
    card.show();
  }
};