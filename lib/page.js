const cheerio = require('cheerio');
const helper = require('./helper');
const parse = require('./parse');
const config = require('../config.json');

exports.start = function* (catalog, chapter, URL) {
  let url = config.webcache.status ? config.webcache.URL + URL : URL;
  let html = yield helper.getHTML(url);
  let $ = cheerio.load(html); 

  try {
    let jsUrl = config.domain + $('script')[1].attribs.src;
    let jscontent = yield helper.getHTML(jsUrl);
    
    let regex = /\/Pic\/[\w|\/]+\.\w+/g;
    let result = jscontent.match(regex);

    try {
      for (let i = 0; i < result.length; i++) {
          // let ID = chapter_id + "_" + (i+1).toString();
          let url = config.domain + result[i];

          let metadata = {
            catalog: catalog,
            chapter: chapter,
            // ID: ID,
            url: url,
          };
          if (metadata)
            setTimeout(function() { parse.post('Page', metadata); }, helper.timeDelay() * 7);

      };
    }
    catch (err) {
        helper.writeLog('pagejs_err.log','err page jsUrl: ' + jsUrl);
    }
  }
  catch (err) {
      helper.writeLog('page_err.log','err page url: ' +  url);
  }
}
