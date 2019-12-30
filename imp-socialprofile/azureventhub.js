var bunyan = require('bunyan');
var eventHub = require('event-bus-stream');

var namespace = '<ServiceBus Namespace>';
var hubName = '<EventHub name>';
var saName = '<Shared Access Policy name>';
var saKey = '<Shared Access Policy key>';

function modificationFunc(obj) {
    // Change the incoming object before its sent.
    // Example: Add a unique id to the object
    // But realize the incoming object may be immutible, so you may
    return obj
}

var streamClient = eventHub.restClient(namespace, hubName, saName, saKey, modificationFunc);

var log = bunyan.createLogger({
    name: '<Logger_Name_Here>',
    streams: [
        {level: 'info', stream: streamClient}
});

module.exports = log;
