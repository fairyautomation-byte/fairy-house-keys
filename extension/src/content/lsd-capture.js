(function () {
  if (window.__ztLsdCaptureInstalled) return;
  window.__ztLsdCaptureInstalled = true;
  var o = window.fetch;
  window.fetch = function (u, opts) {
    var b = opts && opts.body;
    if (typeof u === 'string' && u.indexOf('graphql') !== -1 && b && typeof b === 'string') {
      var m = b.match(/[&?]lsd=([^&]+)/);
      if (m && m[1] && m[1].length > 5) {
        try {
          document.body.setAttribute('data-zt-lsd', decodeURIComponent(m[1].replace(/\+/g, ' ')));
        } catch (e) {}
      }
    }
    return o.apply(this, arguments);
  };
})();
