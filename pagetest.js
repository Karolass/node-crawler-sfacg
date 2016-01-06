var fs = require('fs'),
    request = require('request'), 
    cheerio = require('cheerio');

var domain = "http://comic.sfacg.com",
    startPage = "http://comic.sfacg.com/HTML/QYZ/TBP/XY06/";
var Catalog = [], CatalogCount = 0,
    Chapter = [], ChapterCount = 0,
    Page    = [], PageCount    = 0;

var getHTML = function (url, callback) {
    request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            return callback(body) // return the HTML
        }
    })
}

function start (url) {

    var chapterID = "QYZ";
    getHTML(url, function (html) {
        
        var $ = cheerio.load(html); 

        var jsUrl = domain + $('script')[1].attribs['src'];

        getHTML(jsUrl, function (html) {
            var regex = /\/Pic\/[\w|\/]+\.\w+/g;
            var result = html.match(regex);
            var count = 1;

            for (var i = 0; i < result.length; i++) {
                var ID = chapterID + "_" + count.toString();
                var url = domain + result[i];

                var metadata = {
                    chapter: chapterID,
                    ID: ID,
                    url: url,
                };
                Page[PageCount] = metadata;
                PageCount++;
                count++;
            };
            console.log(Page);
        
        });
        
    });
}

start(startPage);

