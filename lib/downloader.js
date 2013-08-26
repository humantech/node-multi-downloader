
////////////////////////////////////////////////////////////////////////////////
// simple http/s client to download files

var path = require('path'),
	fs = require('fs'),
	url = require('url'),
	EventEmitter = require('events').EventEmitter;

////////////////////////////////////////////////////////////////////////////////
// the main class

var Downloader = function Downloader(options) {

	////////////////////////////////////////////////////////////////////////////
	// force the use of new
	if (this.constructor !== Downloader) {
		throw 'Downloader must be instantiated with "new"!';
	}

	////////////////////////////////////////////////////////////////////////////
	// attach EventEmitter
	EventEmitter.call(this);

	////////////////////////////////////////////////////////////////////////////
	// functions

	this.translate_url = function(location) {
		__url = url.parse(options.url);
		if (!__url.protocol &&
			(__url.protocol !== 'https:' || __url.protocol !== 'http:')) {
			throw 'Downloader only supports http and https protocols.';
		}
		__options.channel = require(__url.protocol === 'https:' ? 'https' : 'http');
		__options.port = __url.port;
		__options.host = __url.hostname;
		__options.path = __url.path;
	};

	this.get_headers = function() {
		var self = this;
		var req = __options.channel.get(__options, function(res) {
			var location = res.headers['location'];
			if (location) {
				console.info('location header found; redirecting to', location);
				self.translate_url(location);
				self.get_headers();
			} else {
				var accept_ranges = res.headers['accept-ranges'] === 'bytes';
				var total_size = parseFloat(res.headers['content-length']);
				self.download(total_size, accept_ranges && __options.concurrency > 1);
			}
			req.abort();
		});

		req.on('error', function(e) {
			self.emit('error', e);
		});
	};

	this.download = function(total_size, concurrent) {
		var concurrents = concurrent ? __options.concurrency : 1;

		var self = this,
			offset = Math.floor(total_size / concurrents),
			req = [],
			filename = [],
			chunk_size = [],
			fd = [],
			start = [],
			eta = [],
			perc = [],
			bps = [],
			delta_time = [],
			current = [],
			i,
			j,
			cycle;


		for (i = 0; i < concurrents; i++) {
			filename[i] = path.join(process.cwd(),	__options.dest,	path.basename(__options.path) + '.part' + i.toString());
		}

		filename.forEach(function(file, h) {
		
			fd[h] = fs.createWriteStream(filename[h], {flags : 'w+', encoding : null, mode : 0666});
			fd[h].on('open', function() {

				var t = this;
				var opt = __options;
				var range = 'bytes=' + (h*offset).toString() + '-' + ((h === concurrents-1) ? '' : ((h*offset)+offset-1).toString());

				start[h] = new Date().getTime();
				current[h] = 0;
				opt['headers'] = { 'Range' : range };

				req[h] = opt.channel.get(opt, function(res) {
					chunk_size[h] = parseFloat(res.headers['content-length']);
					res.pipe(t);
					res.on('data', function (chunk) {
						current[h] += chunk.length;
						delta_time[h] = new Date().getTime() - start[h];
						perc[h] = (current[h] / chunk_size[h]);
						bps[h] = ((chunk_size[h] * perc[h]) / delta_time[h] * 1000);
						eta[h] = ((chunk_size[h] - current[h]) / delta_time[h] / 100);
					});
					res.on('end', function() {
						t.end();
					});
				});
				req[h].on('error', function(e) {
					self.emit('error', e);
				});
			});
		});

		cycle = setInterval(function() {
			var allClose = true,
				p = 0, e = 0, b = 0, j = 0;
			for (j = 0; j < concurrents; j += 1) {
				if (fd[j].writable && !fd[j].closed) { // the node api mess
					allClose = false;
				}
				p += perc[j];
				e += eta[j];
				b += bps[j];
			}

			self.emit('progress', (p/concurrents), e, b);

			if (allClose) {
				clearInterval(cycle);
				// merge all files
				var merged = path.join(process.cwd(), __options.dest, path.basename(__options.path));
				var mergedStream = fs.createWriteStream(merged, {flags : 'w', encoding : null, mode : 0666});
				mergedStream.on('open', function() {
					var t = this;
					var _pump = function(next) {
						var f = fs.createReadStream(fd[next].path, { flags: 'r', encoding: null, bufferSize: 64 * 1024 });
						f.on('data', function(data) {
							t.write(data);
						});
						f.on('end', function() {
							fs.unlink(fd[next].path, function() {});
							if (next+1 < concurrents) {
								_pump(next+1);
							} else {
								t.end();
								self.emit('finish');
							}
						});
					};
					_pump(0);
				});
			}
		}, __options.refresh);
	};

	////////////////////////////////////////////////////////////////////////////
	// required variables
	if (!options ||
		!options.url ||
		typeof options.url !== 'string') {
		throw 'You can\'t download nullables, right?';
	}

	var __options = options,
		__url;

	this.translate_url(__options.url);

	__options.dest = options.dest || '.'; // TODO check if path or directory
	__options.refresh = options.refresh || 500;
	__options.concurrency = options.concurrency || 1;

	this.get_headers();

};

////////////////////////////////////////////////////////////////////////////////
// EventEmitter now tied

Downloader.super_ = EventEmitter;

Downloader.prototype = Object.create(EventEmitter.prototype, {
	constructor : {
		value : Downloader,
		enumerable : false
	}
});

////////////////////////////////////////////////////////////////////////////////
// export module

module.exports = Downloader;
