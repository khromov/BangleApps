const storage = require('Storage');
const settings = storage.readJSON('setting.json', 1) || { };
const logger = require("Storage").open("error-log.csv", "a");

var usbHidEnabled = false;


var forward, backward;

// Power savings stuff
Bangle.setLocked(false);
Bangle.setOptions({ lockTimeout: 0 });

// Sends "key up"
function sendKeyUpEvent(callback) {
  try {
      NRF.sendHIDReport([0,0,0,0,0,0,0,0], function() {
       logger.write("Sent key up event!"+"\n");
      if (callback) {
         callback();
      }
    });
  } catch(e) {
     logger.write("Failed sending keyUp event..."+"\n");
     // TODO: sendKeyUpEvent() with a number of retries here?
  }

}

if (settings.HID=="kb" || settings.HID=="kbmedia") {
  usbHidEnabled = true;

  // https://www.espruino.com/BLE+Keyboard + presentor app
  // https://www.espruino.com/modules/USBKeyboard.js
  const kb = require("ble_hid_keyboard");
  NRF.setServices(undefined, { hid : kb.report });

  // http://forum.espruino.com/conversations/325524/
  // NRF.setConnectionInterval(100);

  forward = function (cb) { 
    try {
      kb.tap(kb.KEY.RIGHT, 0, function(data) {
        console.log("Sent forward!", data);
        logger.write("Sent forward!"+"\n");
      });
    } catch(e) {
      sendKeyUpEvent();
      logger.write(e +"\n");
      console.log("Could not send forward event", e);
    }
  };
  backward = function (cb) {
    try {
      kb.tap(kb.KEY.LEFT, 0, function(data) {
        console.log("Sent backward!", data);
        logger.write("Sent backward!"+"\n");
      });
    } catch(e) {
      sendKeyUpEvent();
      logger.write(e +"\n");
      console.log("Could not send backward event", e);
    }
 };
} else {
  E.showPrompt("Keyboard HID support disabled.", {
    title: "Warning",
    buttons: { "Enable" : true, "Quit" : false},
  }).then(function(enable) {
    if (enable) {
      settings.HID = "kb";
      require("Storage").write('setting.json', settings);
      setTimeout(load, 1000, "presentation_remote.app.js"); // TODO: Change to my app
    } else {
      setTimeout(load, 1000); // Goes back to default app(?)
    }
  });
}

function drawApp() {
  g.clear();
  E.showMessage('Click button to progress to next slide. Press screen to go back.', 'Remote');
}

// Basically checks that we passed the above stuff
if (usbHidEnabled) {
  // Look for pin
  setWatch(function(data) {
    console.log("> Go forward", data);
     forward();
  }, BTN1, { edge: "rising", repeat: true, debounce: 100 });

  Bangle.on('touch', (button, data) => { 
    console.log("< Go back", button, data);
    backward();
  });

  drawApp();
}