const { handleCommand } = require("./controller");
const { ensureSettings } = require("./settings");
const { sendError } = require("./watch-state");

const READY_KEY = "READY";

Pebble.addEventListener("ready", function () {
  console.log("Hive PKJS ready");
  ensureSettings();
  notifyWatchReady();
});

Pebble.addEventListener("appmessage", function (event) {
  handleCommand(event.payload || {}).catch(sendError);
});

function notifyWatchReady() {
  var payload = {};
  payload[READY_KEY] = 1;

  Pebble.sendAppMessage(
    payload,
    function () {},
    function (error) {
      console.log("watch ready notify failed: " + JSON.stringify(error));
    }
  );
}
