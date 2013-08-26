
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
