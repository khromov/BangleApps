const storage = require('Storage');
const settings = storage.readJSON('setting.json', 1) || { };

var sendHid, next, prev, toggle, up, down; //, profile;
var lasty = 0;
var lastx = 0;

var usbHidEnabled = false;

// Power savings stuff
Bangle.setLocked(false);
// Bangle.setLCDTimeout(5);
Bangle.setOptions({ lockTimeout: 0 });
// Bangle.setLCDPower(1);

console.log(settings.HID);
if (settings.HID=="kb" || settings.HID=="kbmedia") {
  usbHidEnabled = true;
  
  // https://www.espruino.com/BLE+Keyboard + presentor app
  // https://www.espruino.com/modules/USBKeyboard.js
  const kb = require("ble_hid_keyboard");
  NRF.setServices(undefined, { hid : kb.report });

  // OLD?
  // https://gist.github.com/MightyPork/6da26e382a7ad91b5496ee55fdc73db2
  sendHid = function (code, cb) {
    try {
      return new Promise( resolve => {
        NRF.sendHIDReport([2,0,0,code,0,0,0,0,0], () => {
          NRF.sendHIDReport([2,0,0,0,0,0,0,0,0], resolve);
        });

        console.log(cb);
        if (cb) {
           cb();
        }
      });
    } catch(e) {
      // TODO: Error log here
      print(e);
    }
  };
  forward = function (cb) { 
    // sendHid(0x4f, cb);
    
    try {
      kb.tap(kb.KEY.RIGHT, 0, function(data) {
        console.log("Sent!", data);
      });
    } catch(e) {
      console.log("Could not send forward event", e);
    }
  };
  backward = function (cb) {
    //sendHid(0x50, cb);
    try {
      kb.tap(kb.KEY.LEFT, 0, function(data) {
        console.log("Sent!", data);
      });
    } catch(e) {
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
  }, BTN1, { edge: "rising", repeat: true, debounce: 50 });

  Bangle.on('touch', (button, data) => { 
    console.log("< Go back", button, data);
    backward();
  });

  drawApp();
}