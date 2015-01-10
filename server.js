var Hapi = require('hapi');
var request = require('request');
var parseString = require('xml2js').parseString;

var server = new Hapi.Server();

server.connection({
  host: '0.0.0.0',
  port: process.env.PORT || 8000
});

function fetchUnsplashData(next) {
  request('https://unsplash.com/rss', function(err, resp, body) {
    if (err) { return next(err); }

    parseString(body, function(err, data) {
      if (err) { return next(err); }

      if (data && data.rss && data.rss.channel && data.rss.channel[0] && data.rss.channel[0].item) {
        next(null, data.rss.channel[0].item);
      } else {
        next(new Error('Invalid RSS Response'));
      }
    });
  });
}

server.method('fetch', fetchUnsplashData, {
  cache: {
    expiresIn: 3600000
  }
});

server.route({
  method: 'GET',
  path: '/',
  config: {
    cache: {
      expiresIn: 86400000
    },
    pre: [{
      assign: 'unsplash',
      method: 'fetch()'
    }]
  },
  handler: function(req, reply) {
    reply({ unsplash: req.pre.unsplash });
  }
});

server.start(function() {
  console.log('server started at '+ server.info.uri);
});
