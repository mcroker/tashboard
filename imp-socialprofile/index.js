/* == Imports == */
var Twitter = require('twitter');
var AWS = require('aws-sdk');
var path = require('path');
var async = require('async');
var d = new Date();

/* == Globals == */
var config = require('./config.json');

var esDomain = config.esDomain;
var endpoint = new AWS.Endpoint(esDomain.endpoint);

var creds = new AWS.EnvironmentCredentials('AWS');

exports.handler = function(event, context) {
  var client = new Twitter(config.twittercreds);
 
  var users=config.users;

  async.each(users, 
    function(item, callback){
      var params = {screen_name: item};
      client.get('users/lookup', params, function(error, usrstatus, response){
        if (!error) {
          //var blob = '{ "logdate": "' + d.toString() + '", "screen_name": "' + user + ', "data":' + JSON.stringify(usrstatus) + '}';
          //console.log(usrstatus);
          postToES( JSON.stringify(usrstatus[0]),  context);
          callback();
        }
      })
    },
    function(err){
      //console.log (output );
      context.succeed('sucess');
    });

  /*
   * Post the given document to Elasticsearch
   */
  function postToES(doc, context) {
    var req = new AWS.HttpRequest(endpoint);

    req.method = 'POST';
    req.path = path.join('/', esDomain.index, esDomain.doctype);
    req.region = esDomain.region;
    req.headers['presigned-expires'] = false;
    req.headers['Host'] = endpoint.host;
    req.body = doc;

    var signer = new AWS.Signers.V4(req , 'es');  // es: service code
    signer.addAuthorization(creds, new Date());

    var send = new AWS.NodeHttpClient();
    send.handleRequest(req, null, function(httpResp) {
        var respBody = '';
        httpResp.on('data', function (chunk) {
            respBody += chunk;
        });
        httpResp.on('end', function (chunk) {
            console.log('Response: ' + respBody);
            //context.succeed('Lambda added document ' + doc);
        });
    }, function(err) {
        console.log('Error: ' + err);
        context.fail('Lambda failed with error ' + err);
    });
  };
};
