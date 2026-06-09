function sendState(state, fallbackError) {
  Pebble.sendAppMessage(
    { STATE: JSON.stringify(state) },
    function () {},
    function (error) {
      console.log("send state failed: " + JSON.stringify(error));
      sendError(fallbackError || "Unable to update watch");
    }
  );
}

function sendError(error) {
  const message =
    error && error.message
      ? error.message
      : typeof error === "string"
        ? error
        : JSON.stringify(error);
  console.log("error: " + message);
  Pebble.sendAppMessage(
    { ERROR: message || "Unknown error" },
    function () {},
    function (error) {
      console.log("send error failed: " + JSON.stringify(error));
    }
  );
}

module.exports = {
  sendState,
  sendError,
};
