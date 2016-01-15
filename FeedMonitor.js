// Constructor
var FeedMonitor = function() {}


var FeedParser = require('feedparser');
var request = require('request');
var moment = require('moment');
var cronJob = require('cron').CronJob;

var notifierUtil = require('./NotifierUtil').create();

var started = false;
var isRunning = false;
var feeds = [];
var currentIdx = 0;

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
  currentIdx = 0;

  if (isRunning)
    logger.warn("startCheckForNewFeeds canceled becasue isRunning=true");
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
  logger.info("==================================================== MAKE REQUEST: " + feed.url);
  var req = request(feed.url);
  var feedparser = new FeedParser([]);

  req.on('error', function(error) {
    var self = this;
    logger.error("Error making request to feed URL");
    logger.error(error);
    logger.info("-------------------------- REQ error --------------------------");
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
    var self = this;

    logger.error("Error reading RSS Feed");
    logger.error(error);
    notifierUtil.notify("Error reading RSS Feed", error);

    logger.info("-------------------------- error ENDED --------------------------");

    currentIdx++;
    checkForNewFeeds();
  });

  feedparser.on('readable', function() {
    var self = this;
    var meta = this.meta;
    var item;

    while (item = self.read()) {
      var m = moment(Date.parse(item.date));
      logger.info("Feed found: " + item.title, item.date, m.fromNow());
    }
    logger.info("-------------------------- read ENDED --------------------------");

    //currentIdx++;
    //checkForNewFeeds();

  });

  feedparser.on('end', function() {

    logger.info("-------------------------- read EVENT END --------------------------");

    currentIdx++;
    checkForNewFeeds();

  });
}

module.exports.create = function() {
  return new FeedMonitor();
};

module.exports._class = FeedMonitor;