// Load Modules

var winston = require('winston');
logger = require('log-colors');

// Load Clases
var notifierUtil = require('./NotifierUtil').create();
var feedUrlsParser = require('./FeedUrlsParser').create();
var feedMonitor = require('./FeedMonitor').create();

// State Variables
var feedsList = []
var path = __dirname;
var feedsFilePath = path + '/feeds';


// Read and Load Feeds file
feedUrlsParser.parse(feedsFilePath, function(feeds) {
  feedsList = feeds;

  for (var idx in feedsList) {
    var feed = feedsList[idx]
    logger.debug("feed (r)", feed.name, feed.url);

  }

  feedMonitor.start(feedsList);

});

notifierUtil.notify("Starting RSS Monitoring", "Good Luck!");