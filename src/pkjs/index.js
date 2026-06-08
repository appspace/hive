const { handleCommand } = require("./controller");
const { ensureSettings } = require("./settings");
const { sendError } = require("./watch-state");

const PKJS_READY_MESSAGE = 15025;

Pebble.addEventListener("ready", function () {
  console.log("Hive PKJS ready");
  ensureSettings();
  notifyWatchReady();
});

Pebble.addEventListener("appmessage", function (event) {
  if (event.payload && event.payload[PKJS_READY_MESSAGE] !== undefined) {
    notifyWatchReady();
    return;
  }

  handleCommand(event.payload || {}).catch(sendError);
});

function notifyWatchReady() {
  var payload = {};
  payload[PKJS_READY_MESSAGE] = 1;

  Pebble.sendAppMessage(
    payload,
    function () {},
    function (error) {
      console.log("watch ready notify failed: " + JSON.stringify(error));
    }
  );
}
