const async = require('async');

var cargo = async.cargo(function(tasks, callback) {
    // for(var i=0; i<tasks.length; i++){
    //     console.log('func: ', tasks[i].name, 'url: ', tasks[i].url);
    // }
    callback();
}, 1);

module.exports = cargo;
