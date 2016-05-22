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
            // Catalog.push(metadata);
            q.push({name:'postParse', url: 'Catalog', run: function(cb) {
                postParse(parseURL + "Catalog", metadata, function(result) {
                    // console.log("POST Catalog success, ID: " + result.objectId);
                });
            }});
            q.concurrency++;
            q.push({name:'comicChapter', url: url, run: function(cb) {
                comicChapter(ID, url);
            }});
            q.concurrency++;
        });
        if (nextPage) {
            q.push({name:'start', url: nextPage, run: function(cb){
                start(nextPage);
            }});
            q.concurrency++;
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
            // Chapter.push(metadata);

            // if (i == $('ul.serialise_list li a').length - 1) {
            //     // console.log(JSON.stringify(catalog, null, 4));
            //     fs.writeFile(catalog.title + '.json', JSON.stringify(catalog, null, 4), function(err) {
            //         if (err) throw err;
            //     });
            // }
            //comicPage(ID, PageUrl);

            q.push({name:'postParse', url: 'Chapter', run: function(cb) {
                postParse(parseURL + "Chapter", metadata, function(result) {
                    // console.log("POST Chapter success, ID: " + result.objectId);
                });
            }});
            q.concurrency++;
            q.push({name:'comicPage', url: PageUrl, run: function(cb) {
                comicPage(ID, PageUrl);
            }});
            q.concurrency++;
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
                var count = 1;

                try {
                    for (var i = 0; i < result.length; i++) {
                        var ID = chapterID + "_" + count.toString();
                        var url = domain + result[i];

                        var metadata = {
                            chapter: chapterID,
                            ID: ID,
                            url: url,
                        };
                        // Page.push(metadata);
                        q.push({name:'postParse', url: 'Page', run: function(cb) {
                            postParse(parseURL + "Page", metadata, function(result) {
                                // console.log("POST Page success, ID: " + result.objectId);
                            });
                        }});
                        q.concurrency++;
                        count++;
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

var q = async.queue(function(task, callback) {
    // console.log('func: ', task.name, ', url: ', task.url);
    task.run(callback);
}, 1, 1);

q.push({ name:'start', url: startPage, run: function(cb) {
    start(startPage);
}});
q.concurrency++;
