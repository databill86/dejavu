
// This file contains all the logic for your app
// authentication and streaming data from your
// endpoint.


// **Configs:** Appname and Credentials
const HOSTNAME = "scalr.api.appbase.io"
var APPNAME, USERNAME, PASSWORD;
var appbaseRef;

parent.globalAppData(function(res) {
  APPNAME = res.appname;
  USERNAME = res.username;
  PASSWORD = res.password;
  init();
});

function init() {
  // Instantiating appbase ref with the global configs defined above.
  appbaseRef = new Appbase({
      url: 'https://'+HOSTNAME,
      appname: APPNAME,
      username: USERNAME,
      password: PASSWORD
  });
}

// vars for tracking current data and types
var sdata = {};         // data to be displayed in table
var headers = ["_type", "_id"];
var esTypes = [];       // all the types in current 'app'
var subsetESTypes = []; // currently 'selected' types



var feed = (function () {

    // processStreams() takes the continuous responses
    // and passes it to it's caller -> UI view.
    function processStreams(response, callback) {
      if (response.hits) {
        for (var hit in response.hits.hits) {
          callback(response.hits.hits[hit]);
        }
      } else {
        callback(response);
      }
      return;
    }

    // applies a streamSearch() query on a particular ``type``
    // to establish a continuous query connection.
    function applyStreamSearch(typeName, callback) {
      if (typeName !== null) {
        appbaseRef.searchStream({
          stream: true,
          type: typeName,
          body: {
            from: 0,  // start from zero: no pagination
            size: 20, // show up to 20 results initally
            query: {
              match_all: {}
            }
          }
        }).on('data', function(res) {
            processStreams(res, callback);
        }).on('error', function(err) {
            console.log("caught a stream error", err);
        });
      }
    }

    return {
        // exposes ``applyStreamSearch()`` as ``getData()``
        getData: function(typeName, callback) {
            applyStreamSearch(typeName, callback);
        },
        // ``deleteData()`` deletes the data records when
        // a type is unchecked by the user.
        deleteData: function(typeName, callback) {
            localSdata = [];
            for (data in sdata) {
                if (sdata[data]._type !== typeName)
                    localSdata.push(sdata[data]);
            }
            sdata = localSdata.slice();
            callback(sdata);
        },
        // gets all the types of the current app;
        getTypes: function(callback){
            appbaseRef.getTypes().on('data', function(res) {
                var types = res.filter(function(val){return val[0]!=='.'});
                console.log(types);
                if (JSON.stringify(esTypes) !== JSON.stringify(types)) {
                  esTypes = types.slice();
                  callback(types);
                }
            }).on('error', function(err) {
                console.log('error in retrieving types: ', err)
            })
        }
    };

}());
