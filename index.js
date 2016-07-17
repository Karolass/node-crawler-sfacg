const co = require('co');
const catalog = require('./lib/catalog');
const chapter = require('./lib/chapter');
const page = require('./lib/page');

let startPage = "http://comic.sfacg.com/Catalog/default.aspx?PageIndex=1";

co(function* () {
  yield catalog.start(startPage);
  // yield chapter.start('HZWXP', 'http://comic.sfacg.com/HTML/HZWXP/');
  // yield page.start('HZWXP001话', 'http://comic.sfacg.com/HTML/HZWXP/001/');
});
