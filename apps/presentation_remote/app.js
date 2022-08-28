const storage = require('Storage');
const settings = storage.readJSON('setting.json', 1) || { vibrate: true };
const logger = require("Storage").open("error-log.csv", "a");

const iconBack = require("heatshrink").decompress(atob("slkwMB/4A/AGfDBZXwh4LJ/0Av4MJ4EHBZP4gE/BhMAgYLJ8AYK/gYLwBKK+EAJRJiBgBiKgEfMRQ9KEgI9JMQKhJMQMBMRZ7JMX5ikAAgpEMQQMJMQIAFFQY9BAAw9FAAp1DPYIAGRwYYHQQYYIEoZKHEoZKIJYahBAAzmDDBA+EaYg4BHwrsELwIGCUQSpFZwa7BG4YsCWAbUGFgLtJEoIfDMgLPEFgJXCMgQFDAwK8FMggGBHAZkHCQZkGIoIYDMg3AKIhkFDAIrDMg3gAopkEHAJEEMgoYFLoI+DDAxkBHwYYFCQJqFDAhkBDBKDFMYoGCJQZ8FD4JKDSopkCFRATCCQbHFAAzaFAAr5FAApvBZogAFRwILJHoLADEg5vFRoqIFGAxWDx6MFcogFCAApWCTIIAHFQgAGHoRbBAAw9DJ4IAGHoQYIMQYYHfopJJJRDeDTQIAFVgg+GXBIA/AFQA=="));

const iconBackInverted = require("heatshrink").decompress(atob("slkwJC/AGs8BZUP+ALJgP/wAMJn/4BZMH//ABhP//gLJj4YKgYYLv5KKh//JRJiB/5iK//gMRQ9KEgI9JMQKhJMQP+MRZ7JMX5ikAAgpEMQQMJMQIAFFQY9BAAw9FAAp1DPYIAGRwYYHQQYYIEoZKHEoZKIJYahBAAzmDDBA+EaYg4BHwrsELwIGCUQSpFZwa7BG4YsCWAbUGFgLtJEoIfDMgLPEFgJXCMgQFDAwK8FMggGBHAZkHCQZkGIoIYDMg0/KIhkFDAIrDMg0fAopkEHAJEEMgoYFLoI+DDAxkBHwYYFCQJqFDAhkBDBKDFMYoGCJQZ8FD4JKDSopkCFRATCCQbHFAAzaFAAr5FAApvBZogAFRwILJHoLADEg5vFRoqIFGAxWDuCMFcogFCAApWCTIIAHFQgAGHoRbBAAw9DJ4IAGHoQYIMQYYHfopJJJRDeDTQIAFVgg+GXBIA/AFQA="));

var usbHidEnabled = false;

var forward, backward;

// Power savings stuff
Bangle.setLocked(false);
Bangle.setLCDTimeout(0);
Bangle.setOptions({ lockTimeout: 0 });

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
      if(settings.vibrate) {
          Bangle.buzz(100, 1);
          setTimeout(() => Bangle.buzz(100, 1), 220);
      }

      kb.tap(kb.KEY.RIGHT, 0, function(data) {
        console.log("Sent forward!", data);
        logger.write("Sent forward!"+"\n");
      });
    } catch(e) {
      // E.showMessage(e, 'Error');
      logger.write(e +"\n");
      console.log("Could not send forward event", e);
    }
  };
  backward = function (cb) {
    try {
      if(settings.vibrate) {
         Bangle.buzz(100, 1); 
      }
      kb.tap(kb.KEY.LEFT, 0, function(data) {
        console.log("Sent backward!", data);
        logger.write("Sent backward!"+"\n");
      });
    } catch(e) {
      // E.showMessage(e, 'Error');
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

  // Background
  // g.setColor(255,203,66);
  g.setColor(255,255,0);
  g.fillRect(0, 0, 118, 176);

  g.setColor(0,0,255);
  g.fillRect(118, 0, 176, 176);

  // +1 button
  g.setColor(255,255,255);
  g.fillCircle(167, 88, 30);
  g.setColor(0,0,0);
  g.setFont("Vector", 25);
  g.drawString("+1", 144, 78 );

  // Back
  g.setColor(0,0,0);
  g.drawImage(iconBackInverted, 26, 44, { scale: 0.6 });
  g.setFont("Vector", 23);
  g.setColor(0, 0, 0);
  g.drawString("Go back", 11, 115 );

  // E.showMessage('Click button to progress to next slide. Press screen to go back.', 'Remote');
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

/*
NRF.on('HID', function(m) {
  E.showMessage(m, 'HID');
});
*/