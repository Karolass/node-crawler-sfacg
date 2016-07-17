const cheerio = require('cheerio');
const helper = require('./helper');
const parse = require('./parse');
const chapter = require('./chapter');
const config = require('../config.json');

exports.start = function* (URL) {
  let url = config.webcache.status ? config.webcache.URL + URL : URL;
  let html = yield helper.getHTML(url);
  let $ = cheerio.load(html); 

  let nextPage = $('li.pagebarNext a').attr('href');
  $('.Comic_Pic_List li:nth-child(2)').each(function (i, element){
    let regex = /^[\w\W]+\/HTML\/(\w+)\/$/;
    let result = $(this).children('strong').children('a').attr('href').match(regex);
    if (result == null) {
        return true;    // cheerio continue;
        //regex = /^[\w\W]+\/mh\/(\w+)\/$/;
        //result = $(this).children('strong').children('a').attr('href').match(regex);
    }
    let ID = result[1];

    let title =  $(this).children('strong').children('a').text();
    /*
    console.log("Author: " + $(this).children('a.Blue_link1')[0].children[0].data);
    console.log("Category: " + $(this).children('a.Blue_link1')[1].children[0].data);
    */
    let author, category;
    $(this).children('a.Blue_link1').each(function (j, elem) {
      if (j % 2 == 0) author = $(this).text();
      else category = $(this).text();
    });

    let description = $(this).children('br')[2].next.data.replace(/\s+|\r|\n|\t/g, '');
    let url = $(this).children('strong').children('a').attr('href');
    let thumbnailurl = $(this).parent().children('li.Conjunction').children().children('img').attr('src');
    
    let metadata = {
        ID: ID,
        title: title,
        author: author,
        category: category,
        description: description,
        url: url,
        thumbnailurl: thumbnailurl,
    };
    if (metadata)
      setTimeout(function() { 
        parse.post('Catalog', metadata, function (parse) {
          require('co')(function* () { yield chapter.start(parse, url); });
        }); 
      }, helper.timeDelay());

    // if (url)
    //   require('co')(function* () { yield chapter.start(ID, url); });
  });
  if (nextPage) {
      // console.log(nextPage);
      // yield this.start(nextPage);
  }
}
