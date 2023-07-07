"use strict";

// Events --------------------------------------------------------

window.addEventListener('keypress', function (event) {
  var key = event.keyCode;
  switch (key) {
    case 32:
      /*space bar*/sceneSettings.pause = !sceneSettings.pause;
      break;
    case 65: /*A*/
    case 97:
      /*a*/sceneSettings.enableGridHelper = !sceneSettings.enableGridHelper;
      break;
    case 83: /*S*/
    case 115:
      /*s*/sceneSettings.enableAxisHelper = !sceneSettings.enableAxisHelper;
      break;
  }
});
$(function () {
  var timerID;
  $(window).resize(function () {
    clearTimeout(timerID);
    timerID = setTimeout(function () {
      onWindowResize();
    }, 250);
  });
});
function onWindowResize() {
  if (/Mobi|Android/i.test(navigator.userAgent)) {
    // do nothing if on mobile platform
    return;
  }
  WIDTH = window.innerWidth;
  HEIGHT = window.innerHeight;
  pixelRatio = window.devicePixelRatio || 1;
  screenRatio = WIDTH / HEIGHT;
  camera.aspect = screenRatio;
  camera.updateProjectionMatrix();
  renderer.setSize(WIDTH, HEIGHT);
  renderer.setPixelRatio(pixelRatio);
}
//# sourceMappingURL=events.js.map
