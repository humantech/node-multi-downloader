node-multi-downloader
=====================

A simple experiment with native node modules to download files from the web, using an approach close to [axel downloader accelerator](http://axel.alioth.debian.org/).

## notes

* I do not want to mantain this project any further;
* This is just a test, if you want to continue it, fork-it, rename-it and go ahead :)
* Buy me a beer if you find it useful, lol.

## known bugs and issues

* The downloader won't work with proxy (afaik);
* The downloader doesn't support resuming, unlike axel;
* If any part of the downloader stops, kaputz to all;
* You may find others since this code is a little bit old (mid 2012).

## example

a simple example would be the one inside example folder:

```javascript
var Downloader = require('../lib/downloader');

var options = {
    url : 'http://fedora.c3sl.ufpr.br/linux/releases/17/Live/x86_64/Fedora-17-x86_64-Live-Desktop.iso',
    concurrency : 4,
    refresh : 1000
};

var download = new Downloader(options);

download.on('progress', function(percent, eta, bps) {
    console.log((percent*100).toFixed(2), '% completed, ETA', eta.toFixed(0), 'seconds', bps.toFixed(0), 'bytes per second');
});

download.on('finish', function() {
    console.log('download completed');
});
```

## license

MIT. See LICENSE.
