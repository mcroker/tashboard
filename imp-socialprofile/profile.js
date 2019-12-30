/* == Imports == */
var Twitter = require('twitter');
var async = require('async');
var lf = require('./loggerFactory');
var d = new Date();

/* == Globals == */
var config = require('./config.json');



exports.import = function() {
  if (typeof config.source.twitter != "undefined")  {
    var client = new Twitter(config.source.twitter);
  };
  if (typeof config.target.elasticsearch != "undefined")  {
    lf.createELK(config.target.elasticsearch);
  };
  if (typeof config.target.splunk != "undefined")  {
    lf.createSplunk(config.target.splunk);
  };

  var users=config.profiles;

  var results=[];

  async.each(users,
    function(item, usercallback){

      var useritem={};
      useritem.name=item.name;

      // Gather data and then post result
      async.parallel([

        /* Twitter */
        function(parallelcallback){
          if (typeof item.twitter != "undefined" && typeof config.source.twitter != "undefined") {
            console.log ( 'Twitter: ' + item.twitter );
            var params = {screen_name: item.twitter };
            client.get('users/lookup', params, function(error, usrstatus, response){
              if (!error) {
                useritem.twitter = usrstatus[0];
                //console.log(JSON.stringify(useritem.twitter));
                parallelcallback();
              } else {
                console.log('Error:' + JSON.stringify(error));
                parallelcallback(error);
              }
            })
          }
        }, //twitter ,

        /* Linkedin */
        function(parallelcallback) {
          if (typeof item.linkedin != "undefined") {
            console.log ( 'Linkedin: ' + item.linkedin );
          }
          parallelcallback();
        } //linkedin

      ], //async.parallel - functions

      function(err, data) { //async.parallel - once complete
        /* Once parallel done */
        console.log('pushing:' + useritem.name);
        results.push(useritem);
        lf.info(useritem);
        //console.log(JSON.stringify(userresults));
        usercallback();
      }); //async.parallel - once done

    }, //foreach - itterate

    function(err, data) {  //user foreach complete
      console.log('all done');
      //console.log(JSON.stringify(results));
    } //
  );

};

function postdata(data) {
  //console.log ( 'Postdata"' + data );
};
