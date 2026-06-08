function sendState(state) {
  Pebble.sendAppMessage(
    { STATE: JSON.stringify(state) },
    function () {},
    function (error) {
      console.log("send state failed: " + JSON.stringify(error));
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
  Pebble.sendAppMessage({ ERROR: message || "Unknown error" });
}

module.exports = {
  sendState,
  sendError,
};
