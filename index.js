var fs = require('fs'),
    request = require('request'), 
    cheerio = require('cheerio');

var domain = "http://comic.sfacg.com",
    startPage = "http://comic.sfacg.com/Catalog/default.aspx?PageIndex=1";
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

    var nextPage;

    getHTML(url, function (html) {
        //console.log(html);
        var $ = cheerio.load(html); 
        nextPage = $('li.pagebarNext a').attr('href');

        $('.Comic_Pic_List li:nth-child(2)').each(function(i, element){
            var regex = /^[\w\W]+\/HTML\/(\w+)\/$/;
            var result = $(this).children('strong').children('a').attr('href').match(regex);
            if (result == null) {
                return true;    // cheerio continue;
                //regex = /^[\w\W]+\/mh\/(\w+)\/$/;
                //result = $(this).children('strong').children('a').attr('href').match(regex);
            }
            var ID = result[1];

            var title =  $(this).children('strong').children('a').text();
            /*
            console.log("Author: " + $(this).children('a.Blue_link1')[0].children[0].data);
            console.log("Category: " + $(this).children('a.Blue_link1')[1].children[0].data);
            */
            var author, category;
            $(this).children('a.Blue_link1').each(function(j, elem) {
                if (j % 2 == 0) {
                    author =  $(this).text();
                }
                else {
                    category = $(this).text();
                }
            });

            var description = $(this).children('br')[2].next.data.replace(/\s+|\r|\n|\t/g, '');
            var url = $(this).children('strong').children('a').attr('href');
            var thumbnailurl = $(this).parent().children('li.Conjunction').children().children('img').attr('src');
            
            var metadata = {
                ID: ID,
                title: title,
                author: author,
                category: category,
                description: description,
                url: url,
                thumbnailurl: thumbnailurl,
            };
            Catalog[CatalogCount] = metadata;
            CatalogCount++;

            console.log("comicChapter start ");
            comicChapter(ID, url);
            //console.log(metadata);
            console.log("comicChapter end ");
        }); 
        /*   
        if (nextPage != null)   start(nextPage);
        else {
            //console.log(Catalog);
            //console.log(Catalog.length);
            fs.writeFile('catalog.json', JSON.stringify(Catalog, null, 4), function(err) {
                if (err) throw err;
            });
        } 
        */  
    });
}

function comicChapter (catalogID, url) {

    getHTML(url, function (html) {
        var $ = cheerio.load(html); 

        $('ul.serialise_list li a').each(function(i, element) {
            var title = $(this).text();
            if (title == null)  title = $(this).children('font').text();
            var ID = catalogID + title;
            var PageUrl = domain + $(this).attr('href');

            var metadata = {
                catalog: catalogID,
                ID: ID,
                title: title,
            };
            Chapter[ChapterCount] = metadata;
            ChapterCount++;

            console.log("comicPage start ");
            comicPage(ID, PageUrl);
            console.log("comicPage end ");
        });
        
        fs.writeFile('chapter.json', JSON.stringify(Chapter, null, 4), function(err) {
            if (err) throw err;
        });
        
    });
}

function comicPage (chapterID, url) {

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
            fs.writeFile('page.json', JSON.stringify(Page, null, 4), function(err) {
                if (err) throw err;
            });
        
        });
        
    });
}

start(startPage);

