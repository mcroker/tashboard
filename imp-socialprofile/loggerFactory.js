var bunyan = require("bunyan");
var splunkBunyan = require("splunk-bunyan-logger");
var esBunyan = require('bunyan-elasticsearch');
var eventHub = require('node-event-hub-stream');
var async = require('async');

var loggerPool=[];

/* ELK */
exports.createELK = function(config) {
  var esStream = new esBunyan(config);
  esStream.on('error', function (err) {
    console.log('Elasticsearch Stream Error:', err.stack);
  });

  var logger = bunyan.createLogger({
    name: "tashboard_elk",
    streams: [
      { stream: process.stdout },
      { stream: esStream }
    ],
    serializers: bunyan.stdSerializers
  });
  loggerPool.push(logger);
}

/* Splunk */
exports.createSplunk = function(config) {

  var splunkStream = splunkBunyan.createStream(config);

  splunkStream.on("error", function(err, context) {
    // Handle errors here
    console.log("Error", err, "Context", context);
  });

  // Setup Bunyan, adding splunkStream to the array of streams
  var logger = bunyan.createLogger({
    name: "tashboard_splunk",
    streams: [
      splunkStream
    ]
  });
  loggerPool.push(logger);
}

exports.createAzureEventHub = function(config) {

  function modificationFunc(obj) {
    // Change the incoming object before its sent.
    // Example: Add a unique id to the object
    // But realize the incoming object may be immutible, so you may
    return obj
  }

  var streamClient = eventHub.restClient(config.namespace, config.hubName, config.saName, config.saKey, modificationFunc);

  var logger = bunyan.createLogger({
    name: 'tashboard_azureeventhub',
    streams: [
      {level: 'info', stream: streamClient}
    ]
  });

  loggerPool.push(logger);
};

exports.info = function(data) {
  async.each(loggerPool,
    function(item, logcallback){
      item.info(data);
      logcallback();
    },
    function(err, data) {  //user foreach complete
      return;
    } );
  };
