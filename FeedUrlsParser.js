// Constructor
var FeedUrlsParser = function() {}


var fs = require('fs');

FeedUrlsParser.prototype.parse = function(feedsFilePath, cb) {
  if (fs.existsSync(feedsFilePath)) {
    try {
      var feedsContent = JSON.parse(fs.readFileSync(feedsFilePath, 'utf8'));
      var feedsList = [];

      for (var idx in feedsContent.feeds) {
        var feed = feedsContent.feeds[idx]
        logger.debug("feed", feed.name);
        logger.debug("feed", feed.url);
        feedsList.push(feed);
        cb(feedsList);
      }
      //logger.info("Feed Content", feedsContent);
    }
    catch (e) {
      logger.error("Can not parse feeds file: " + feedsFilePath);
      logger.error(e);
    }
  }
  else {
    logger.error("Can not read feeds file: " + feedsFilePath);
  }

};

module.exports.create = function() {
  return new FeedUrlsParser();
};

module.exports._class = FeedUrlsParser;