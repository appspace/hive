/**
 * Created by Eugene on 2015-12-18.
 * This is the app run within sandbox on user's phone.
 *
 */

Pebble.addEventListener('ready', function(e) {
    console.log('JavaScript app ready and running!');
    var req = new XMLHttpRequest();
    req.open('GET', 'https://api.ecobee.com/1/analytics', false);
    req.onload = function () {
        if (req.readyState === 4
            && req.status === 200) {
            var response = JSON.parse(req.responseText);
            console.log('Response received: '+req.status + ' '+JSON.stringify(response));
            Pebble.sendAppMessage({
                'REQ_STATUS': req.status,
                'REQ_CODE': response.status.code,
                'REQ_MESSAGE': response.status.message
            });
        } else {
            Pebble.sendAppMessage({
                'REQ_STATUS': req.status,
                'REQ_CODE': req.status,
                'REQ_MESSAGE': req.responseText
            });
        }
    };
    req.send(null);
});

Pebble.addEventListener('appmessage', function(e) {
    console.log('Received message: ' + JSON.stringify(e.payload));
});

Pebble.addEventListener('showConfiguration', function(e) {
    // Show config page
    Pebble.openURL('https://www.ecobee.com');
});