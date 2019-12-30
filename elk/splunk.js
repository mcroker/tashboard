/* == Imports == */

function postToES(doc, esDomain ) {
  var AWS = require('aws-sdk');
  var path = require('path');
  var endpoint = new AWS.Endpoint(esDomain.endpoint);
  var creds = new AWS.EnvironmentCredentials('AWS');

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
        return(true)
        //context.succeed('Lambda added document ' + doc);
      });
  }, function(err) {
    console.log('Error: ' + err);
    return new error('Lambda failed with error ' + err);
  })  ;
};
