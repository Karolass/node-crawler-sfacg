const cheerio = require('cheerio');
const helper = require('./helper');
const parse = require('./parse');
const page = require('./page');
const config = require('../config.json');

exports.start = function* (catalog_id, URL) {
  let url = config.webcache.status ? config.webcache.URL + URL : URL;
  let html = yield helper.getHTML(url);
  let $ = cheerio.load(html); 

  $('ul.serialise_list li a').each(function (i, element) {
    let title = $(this).text();
    if (title == null) title = $(this).children('font').text();
    let ID = catalog_id + title;
    let PageUrl = config.domain + $(this).attr('href');

    let metadata = {
        catalog: catalog_id,
        ID: ID,
        title: title,
    };

    if (metadata)
      setTimeout(function() { parse.post('Chapter', metadata); }, helper.timeDelay());

    if (PageUrl)
      require('co')(function* () { yield page.start(ID, PageUrl); });
  });
}
