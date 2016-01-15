var FeedParser = require('feedparser');
var request = require('request');
var moment = require('moment');
var cronJob = require('cron').CronJob;
var storage = require('node-persist');

var notifierUtil = require('./NotifierUtil').create();

var started = false;
var isRunning = false;
var feeds = [];
var currentIdx = 0;

// Constructor
var FeedMonitor = function() {
  logger.info("Constructor");
  storage.initSync();
}


// Start Monitor
FeedMonitor.prototype.start = function(_feeds) {
  if (started || _feeds == undefined || _feeds.length <= 0)
    return;

  // Scann RSS feed for changes on a schedule
  var cron = new cronJob('0,10,20,30,40,50 * * * * *', startCheckForNewFeeds, null, true, 'America/Los_Angeles');
  started = true;
  logger.info('Cron Started');
  feeds = _feeds;
};


function startCheckForNewFeeds() {
  logger.info('Cron time!');
  logger.info("Storage size: " + storage.length());
  currentIdx = 0;

  if (isRunning)
    logger.warn("startCheckForNewFeeds canceled becasue isRunning==true");
  else
    checkForNewFeeds();
}

function checkForNewFeeds() {
  var self = this;

  logger.debug("checkForNewFeeds  check: " + currentIdx + " == " + feeds.length);
  if (currentIdx == feeds.length) {
    logger.debug("checkForNewFeeds: END!: " + currentIdx + " == " + feeds.length);
    isRunning = false;
    return;
  }

  var feed = feeds[currentIdx];
  logger.debug("checkForNewFeeds  currentIdx: " + currentIdx);
  logger.debug("checkForNewFeeds: " + feed.name);
  isRunning = true;


  // Make the request to the feed URL
  logger.info(" ");
  logger.info("==================================================== MAKE REQUEST: " + feed.url);
  var req = request(feed.url);
  var feedparser = new FeedParser([]);

  req.on('error', function(error) {
    var self = this;
    logger.error("Error making request to feed URL");
    logger.error(error);

    currentIdx++;
    checkForNewFeeds();
  });

  req.on('response', function(res) {
    var self = this;

    if (res.statusCode != 200) {
      logger.error("URL request was not 200 (http response code): " + res.statusCode);
      return this.emit('error', new Error('URL request was not 200 (http response code)'));
    }

    // Response was ok, let's parse the feed
    self.pipe(feedparser);
  });


  feedparser.on('error', function(error) {
    logger.error("Error reading RSS Feed", error);
    //notifierUtil.notify("Error reading RSS Feed", error);
    logger.info("-------------------------- error ENDED --------------------------");
  });

  feedparser.on('readable', function() {
    var self = this;
    var meta = this.meta;
    var item;

    while (item = self.read()) {
      var m = moment(Date.parse(item.date));
      logger.info("Feed found: " + item.title, item.date, m.fromNow());
      processFeed(item);
    }

  });

  feedparser.on('end', function() {
    logger.info("-------------------------- read EVENT END --------------------------");
    currentIdx++;
    checkForNewFeeds();
  });
}

function processFeed(item) {
  var timeStamp = Date.parse(item.date).getTime();
  var id = (item.guid + String(timeStamp)).replace(/[^a-zA-Z ]/g, "");

  var foundNewFeed = false;
  storage.forEach(function(key, value) {
    logger.info("Foreach: " + key + " vs " + id);
    if (id == key) {
      logger.info("match: " + key);
      logger.info("match: " + id);
      foundNewFeed = true;
    }
  });

  logger.info("Foreach: DONE. New feed found: " + foundNewFeed);
  if (foundNewFeed) {
    // Show notification for new feed found
    notifierUtil.notify(item.title, "New Feed");
    //logger.info(":::", item)
  }
  else {
    // Store feed, so we can compare later.
    storage.setItem(id, "0", function(error) {
      if (error)
        logger.error("Error storing item", error);
      else
        logger.info("Item stored: " + id);
    });
  }

}

module.exports.create = function() {
  return new FeedMonitor();
};

module.exports._class = FeedMonitor;