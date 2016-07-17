var Parse = require('parse/node');
const config = require('../config.json');

if (config.Parse.type != "server")
  Parse.initialize(config.Parse.appId, config.Parse.jsId);
else {
  Parse.initialize(config.Parse.serverId);
  Parse.serverURL = config.Parse.serverURL;
}

exports.post = function (className, json, callback) {
  var ParseObject = Parse.Object.extend(className);
  var po = new ParseObject();
  po.save(json, {
    success: function(po) {
      console.log('New object created with objectId: ' + po.id);
      callback(po);
    },
    error: function(po, error) {
      console.log('Failed to create new object, with error code: ' + error.message);
    }
  });
}
