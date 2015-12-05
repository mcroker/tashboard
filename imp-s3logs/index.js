console.log('Loading function');

var AWS = require('aws-sdk');
var s3 = new AWS.S3({ apiVersion: '2006-03-01' });
var path = require('path');
var parse = require('clf-parser'); 

/* == Globals == */
// Assume that config.default will be copied to config.json and the correct values set
// config.json contains private information - and should not be shared - gitignore should include this
var esDomain = require('./config.json');

var endpoint = new AWS.Endpoint(esDomain.endpoint);
var creds = new AWS.EnvironmentCredentials('AWS');

exports.handler = function(event, context) {

    // Get the object from the event and show its content type
    var bucket = event.Records[0].s3.bucket.name;
    var key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
    var params = {
        Bucket: bucket,
        Key: key
    };
    s3.getObject(params, function(err, data) {
        if (err) {
            console.log(err);
            var message = "Error getting object " + key + " from bucket " + bucket +
                ". Make sure they exist and your bucket is in the same region as this function.";
            console.log(message);
            context.fail(message);
        } else {
            //console.log('CONTENT TYPE:', data.ContentType);
            //console.log('CONTENT BODY:', data.Body.toString());
            var logRecord = parse(data.Body.toString());
            var serializedRecord = JSON.stringify(logRecord);

            postToES(serializedRecord, context)
            //context.succeed('SUCCESS: ' + data.ContentType);
        }
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
            context.succeed('Lambda added document ' + doc);
        });
    }, function(err) {
        console.log('Error: ' + err);
        context.fail('Lambda failed with error ' + err);
    });
  }
};
