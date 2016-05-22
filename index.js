var fs = require('fs'),
    request = require('request'), 
    cheerio = require('cheerio'),
    async = require('async');

var domain = "http://comic.sfacg.com",
    startPage = "http://comic.sfacg.com/Catalog/default.aspx?PageIndex=1",
    parseURL = "http://vivalalova.tk:4000/parse/classes/";

var getHTML = function (url, callback) {
    request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            return callback(body) // return the HTML
        }
    })
}

var postParse = function (url, postData, callback) {
    request({ 
        uri: url,
        method: "POST",
        headers: {
            "X-Parse-Application-Id": "myAppId",
            "Content-Type": "application/json"
        },
        json: true,
        body: postData
    }, function (error, response, body) {
        if (!error && response.statusCode == 201) {
            return callback(body) // return the HTML
        }
        else
            console.log("error: " + error)
            console.log("response.statusCode: " + response.statusCode)
            console.log("response.statusText: " + response.statusText)
    });
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

            cargo.push({name:'postParse', url: 'Catalog'}, function(err) {
                postParse(parseURL + "Catalog", metadata, function(result) {
                    // console.log("POST Catalog success, ID: " + result.objectId);
                });
            });
            cargo.push({name:'comicChapter', url: url}, function(err) {
                setTimeout(function() { comicChapter(ID, url); }, 500);
            });
        });
        if (nextPage) {
            cargo.push({name:'start', url: nextPage}, function(err) {
                setTimeout(function() { start(nextPage); }, 500);
            });
        }
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

            // if (i == $('ul.serialise_list li a').length - 1) {
            //     // console.log(JSON.stringify(catalog, null, 4));
            //     fs.writeFile(catalog.title + '.json', JSON.stringify(catalog, null, 4), function(err) {
            //         if (err) throw err;
            //     });
            // }
            //comicPage(ID, PageUrl);

            cargo.push({name:'postParse', url: 'Chapter'}, function(err) {
                postParse(parseURL + "Chapter", metadata, function(result) {
                    // console.log("POST Chapter success, ID: " + result.objectId);
                });
            });
            cargo.push({name:'comicPage', url: PageUrl}, function(err) {
                setTimeout(function() { comicPage(ID, PageUrl); }, 500);
            });
        });
        
        // fs.writeFile('chapter.json', JSON.stringify(Chapter, null, 4), function(err) {
        //     if (err) throw err;
        // });
        
    });
}

function comicPage (chapterID, url) {

    getHTML(url, function (html) {
        
        var $ = cheerio.load(html); 
        
        try {
            var jsUrl = domain + $('script')[1].attribs.src;

            getHTML(jsUrl, function (html) {
                var regex = /\/Pic\/[\w|\/]+\.\w+/g;
                var result = html.match(regex);

                try {
                    for (var i = 0; i < result.length; i++) {
                        var ID = chapterID + "_" + (i+1).toString();
                        var url = domain + result[i];

                        var metadata = {
                            chapter: chapterID,
                            ID: ID,
                            url: url,
                        };

                        cargo.push({name:'postParse', url: 'Page'}, function(err) {
                            postParse(parseURL + "Page", metadata, function(result) {
                                // console.log("POST Page success, ID: " + result.objectId);
                            });
                        });
                    };
                }
                catch (err) {
                    console.log('err page jsUrl: ', jsUrl);
                }
                
            });
        }
        catch (err) {
            console.log('err page url: ', url);
        }
        
    });
}

var cargo = async.cargo(function(tasks, callback) {
    for(var i=0; i<tasks.length; i++){
        console.log('func: ', tasks[i].name, 'url: ', tasks[i].url);
    }
    callback();
}, 1);

cargo.push({ name:'start', url: startPage}, function(err) {
    start(startPage);
});
