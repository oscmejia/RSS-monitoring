// Constructor
var NotifierUtil = function() {}


var notifier = require('node-notifier');
var path = require('path');


NotifierUtil.prototype.notify = function(title, msg, icon, cb) {

  if (icon == '') icon = 'icon.png';

  notifier.notify({
    'title': title,
    'message': msg,
    icon: path.join(__dirname, icon),
    sound: "Blow",
    wait: true,
    contentImage: void 0
  }, function(err, response) {
    if (err)
      logger.error(error, err);
    else
      logger.info("Closed by user!");

    // Call the callback if defined.
    if (cb)
      cb(err, response);
  });
};

module.exports.create = function() {
  return new NotifierUtil();
};

module.exports._class = NotifierUtil;