/**
 * Created by Eugene on 2015-12-18.
 * This is the app run within sandbox on user's phone.
 *
 */

Pebble.addEventListener('ready', function(e) {
    console.log('JavaScript app ready and running!');
});

Pebble.addEventListener('appmessage', function(e) {
    console.log('Received message: ' + JSON.stringify(e.payload));
});