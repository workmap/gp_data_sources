console.log('Server-side code running');
const express = require('express');
const axios = require('axios');
const app = express();
// serve files from the public directory
app.use(express.static('public'));

// start the express web server listening on 8080
app.listen(8081, () => {
  console.log('listening on 8081');
});
const getGPDatasets = () => new Promise((resolve, reject) => {
    // Make a request for a user with a given ID
    let payload = {};
    axios.get('https://ual.geoplatform.gov/api/datasets')
    .then(function (response) {
        // handle success
        console.log('RESPONSE: ', response);
        payload.status = 'success';
        payload.totalResults = response.data.totalResults; 
        axios.get(`https://ual.geoplatform.gov/api/datasets?size=${payload.totalResults}`)
        .then(function (response) {
            // handle success
            payload.status = 'success';
            payload.type = 'GPDatasets';
            console.log('response.data.results: ', response.data.results[0]);
            payload.data = response.data.results.map(r => {return {
                    "id": r.id, 
                    "uri": r.uri,
                    "label": r.label,
                    "description": r.description
                }
            });
        })
        .catch(function (error) {
            // handle error
            console.log(error);
            payload.status = 'error';
            payload.type = 'GPDatasets';
            payload.error_desc = 'getGPDatasets failed getting dataset totalResults value'; 
            payload.error = error;
        })
        .then(function () {
            resolve(payload);
            // always executed
        });
    })
    .catch(function (error) {
        // handle error
        console.log(error);
        payload.status = 'error';
        payload.type = 'GPDatasets';
        payload.error_desc = 'getGPDatasets failed getting dataset totalResults value';
        payload.error = error;
        resolve (payload);
    })
});
const getCKANDatasets = (gpDataset) => new Promise((resolve, reject) => {
    // Make a request for a user with a given ID
    let payload = {};
    var promises = gpDataset.data.map(function(obj){
      return axios.get(`https://www.geoplatform.gov/resources/datasets/${obj.id}`)
          .then(function (response) {
              // handle success
              payload.status = 'success';
              payload.type = 'GPDatasets';
              payload.data = response.data.results.map(r => {return {
                      "id": r.id, 
                      "uri": r.uri,
                      "label": r.label,
                      "description": r.description
                  }
              });
          })
          .catch(function (error) {
              // handle error
              console.log(error);
              payload.status = 'error';
              payload.type = 'GPDatasets';
              payload.error_desc = 'getGPDatasets failed getting dataset totalResults value'; 
              payload.error = error;
          })
          .then(function () {
              resolve(payload);
              // always executed
          });
    })
    Promise.all(promises).then(function(results) {
      console.log(results)
    })
    
    return Promise.all(promises);
    // axios.get('/user?ID=12345')
    // .then(function (response) {
    //     // handle success
    //     console.log(response);
    //     payload.status = 'success';
    //     payload.data = response;
    // })
    // .catch(function (error) {
    //     // handle error
    //     console.log(error);
    //     payload.status = 'error';
    //     payload.error = error;
    // })
    // .then(function () {
    //     resolve(payload);
    //     // always executed
    // });
    payload.status = 'success';
    payload.type = 'GPDatasets';
    payload.data = 'CKANData';
    resolve(payload);
});
const compareDatasets = () => new Promise((resolve, reject) => {
    console.log('compareDatasets');
    getGPDatasets().then((gpDataset) => {
        let payload = {}
        resolve({msg: 'success', gpDataset});
        // Promise.all([getCKANDatasets(gpDataset)]).then((values) => {
        //     console.log('compareDatasets Promise.all values: ', values);
        //     resolve({msg: 'success', values});
        // });
        
    });
});
app.get('/compareData/', (req, res) => {
    compareDatasets().then((msg) => {
        
        console.log("MSG: ", msg);
        res.send('everything\'s cool '+ JSON.stringify(msg));    
    });
});
// serve the homepage
app.get('/', (req, res) => {
    console.log('DIR_NAME: ', __dirname);
  res.sendFile(__dirname + '/index.html');
});