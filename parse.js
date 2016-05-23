var Parse = require('parse/node');

Parse.initialize("KDH83EpxyMPfPXNo22oKi62uXwCM33iaWF5WvOuB", "Xxr3IUG8rPVtAsPQjegGAySRDuOHbXmIMg9FUNza");
// Parse.initialize("myAppId");
// Parse.serverURL = 'http://vivalalova.tk:4000/parse';

exports.post = function (className, json) {
  var ParseObject = Parse.Object.extend(className);
  var po = new ParseObject();
  po.save(json, {
    success: function(po) {
      console.log('New object created with objectId: ' + gameScore.id);
    },
    error: function(po, error) {
      console.log('Failed to create new object, with error code: ' + error.message);
    }
  });
}
