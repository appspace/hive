function requestJson(url, options) {
  options = options || {};
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open(options.method || "GET", url, true);

    var headers = options.headers || {};
    Object.keys(headers).forEach(function (key) {
      xhr.setRequestHeader(key, headers[key]);
    });

    xhr.onload = function () {
      var payload = parseJson(xhr.responseText);
      if (xhr.status >= 200 && xhr.status < 300) resolve(payload);
      else reject(requestError(payload, xhr.status, xhr.responseText));
    };
    xhr.onerror = function () {
      reject(new Error("Network error"));
    };
    xhr.send(options.body || null);
  });
}

function parseJson(text) {
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (_) {
    return { message: text };
  }
}

function requestError(payload, status, responseText) {
  var message =
    payload.error_description || payload.message || "HTTP " + status;
  var error = new Error(message);
  error.status = status;
  error.payload = payload;
  error.responseText = responseText || "";
  return error;
}

module.exports = {
  requestJson: requestJson,
};
