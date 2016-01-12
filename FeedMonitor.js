// Constructor
var FeedMonitor = function() {
  logger.info('FeedMonitor Constructor');
}


var FeedParser = require('feedparser');
var request = require('request');
var moment = require('moment');
var cronJob = require('cron').CronJob;

var notifierUtil = require('./NotifierUtil').create();

var started = false;
var isRunning = false;
var feeds = [];

FeedMonitor.prototype.start = function(_feeds) {
  if (started || _feeds == undefined || _feeds.length <= 0)
    return;

  var cron = new cronJob('0,10,20,30,40,50 * * * * *', startCheckForNewFeeds, null, true, 'America/Los_Angeles');
  started = true;
  logger.info('Cron Started');
  feeds = _feeds;
};


function startCheckForNewFeeds() {
  logger.info('Cron time!');

  if (isRunning)
    logger.warn("startCheckForNewFeeds canceled becasue isRunning=true");
  else
    checkForNewFeeds(0);
}

function checkForNewFeeds(idx) {
  logger.debug("checkForNewFeeds: " + feeds.length + " vs. " + idx);

  if (idx == (feeds.length - 1)) {
    logger.debug("checkForNewFeeds: END!");
    isRunning = false;
    return;
  }

  var feed = feeds[idx];
  logger.debug("checkForNewFeeds: " + feed.name + " for idx: " + idx);
  isRunning = true;




  var req = request(feed.url);
  var feedparser = new FeedParser([]);

  req.on('error', function(error) {
    logger.error("Error making request to feed URL");
    logger.error(error);
    logger.info("-------------------------- REQ error --------------------------");
    checkForNewFeeds(idx++);
  });

  req.on('response', function(res) {
    var stream = this;

    if (res.statusCode != 200) {
      logger.error("URL request was not 200 (http response code): " + res.statusCode);
      return this.emit('error', new Error('URL request was not 200 (http response code)'));

    }

    stream.pipe(feedparser);
  });


  feedparser.on('error', function(error) {
    logger.error("Error reading RSS Feed");
    logger.error(error);
    notifierUtil.notify("Error reading RSS Feed", error);
    logger.info("-------------------------- error --------------------------");
    checkForNewFeeds(idx++);
  });

  feedparser.on('readable', function() {
    var stream = this;
    var meta = this.meta;
    var item;

    while (item = stream.read()) {
      var m = moment(Date.parse(item.date));
      logger.info("Feed found: " + item.title, item.date, m.fromNow());
    }
    logger.info("-------------------------- read --------------------------");
    checkForNewFeeds(idx++);
  });
}

module.exports.create = function() {
  return new FeedMonitor();
};

module.exports._class = FeedMonitor;