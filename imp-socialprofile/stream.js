/* == Imports == */
var Twitter = require('twitter');
var async = require('async');
var lf = require('./loggerFactory');
var sentiment = require('sentiment');


/* == Globals == */
var config = require('./config.json');


exports.import = function() {

  if (typeof config.streams != "undefined" && typeof config.source.twitter != "undefined" &&
  config.streams.length > 0 )  {

    var client = new Twitter(config.source.twitter);

    // start a steam for each configuered stream
    async.each(config.streams, function(item, streamcallback) {

      console.log('Starting stream:' + item.track);

      client.stream('statuses/filter', {track: item.track }, function(stream) {
        stream.on('data', function(tweet) {

         mentionmatch(tweet.text);

          tweet.sentiment = sentiment(tweet.text);
        //  console.dir(tweet);    // Score: 7, Comparative: 1.75
        });

        stream.on('error', function(error) {
          throw error;
        });

        streamcallback();

      }); //client.stream
    }, //async.each
    function(err, data) {

    });
  };
};



function mentionmatch(text) {
  console.log('Matching text:' + text);

  async.each(config.parties, function(item, matchcallback) {
      var mentions=false;
      for (var i = 0, len = item.patterns.length; i < len; i++) {
        if ( text.match(item.patterns[i]) ) mentions=true;
      };

      console.log(text + '---' + item.name + '---' + mentions );
      matchcallback();

  }, //async.each
  function(err, data) {

  });
};
