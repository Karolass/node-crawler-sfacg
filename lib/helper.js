const { wrap: async } = require('co');
const request = require('co-request');
const sleep = require('co-sleep');
const config = require('../config.json');

exports.getHTML = async(function* (URL) {
  try {
    yield sleep(this.timeDelay());
    let response = yield request(URL);

    return response.body;
  }
  catch (err) { throw err; }
});

exports.timeDelay = function () {
  var max = config.delay.max, min = config.delay.min, ms = 1000;
  var ran = Math.floor((Math.random()*(max-min)+min)*10)/10*ms;
  return ran;
}

exports.writeLog = function(src, text) {
  fs.appendFile(src, text + "\n", function (err) {
      if (err) throw err;
  });
}
