var FeedParser = require('feedparser');
var request = require('request');
var notifierUtil = require('./NotifierUtil').create();
var moment = require('moment');

var startDate = moment('2013-5-11 8:73:18', 'YYYY-M-DD HH:mm:ss')
var endDate = moment('2013-5-11 10:73:18', 'YYYY-M-DD HH:mm:ss')



var req = request('https://www.upwork.com/jobs/atom?category2=web_mobile_software_dev&subcategory2=mobile_development&budget=1000-100000&contractor_tier=2%2C3&duration=month%2Cquarter%2Csemester%2Congoing%2Cnone&sort=create_time+desc&api_params=1&q=');
var feedparser = new FeedParser([]);

req.on('error', function(error) {
  // handle any request errors
});

req.on('response', function(res) {
  var stream = this;

  if (res.statusCode != 200) {

    return this.emit('error', new Error('Bad status code'));
  }
  stream.pipe(feedparser);
});


feedparser.on('error', function(error) {
  notifierUtil.notify('Error reading RSS Feed', error);
});

feedparser.on('readable', function() {
  // This is where the action is!
  var stream = this;
  var meta = this.meta;
  var item;

  while (item = stream.read()) {
    var m = moment(Date.parse(item.date));
    console.log(item.title, item.date, m.fromNow());
    console.log(' ');
  }
});