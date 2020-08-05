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
        // console.log('RESPONSE: ', response);
        payload.status = 'success';
        payload.totalResults = response.data.totalResults; 
        console.log('payload.totalResults: ', payload.totalResults);
        axios.get(`https://ual.geoplatform.gov/api/datasets?size=${payload.totalResults}`)
        .then(function (response) {
            // handle success
            payload.status = 'success';
            payload.type = 'GPDatasets';
            // console.log('response.data.results: ', response.data.results[0]);
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
const getGPRelatedRecords = (gpDataset) => new Promise(async (resolve, reject) => {
    //retrieves records from Geoplatform and assigns the related records and modified date to the gpDataset object.
    await Promise.all(gpDataset.data.map(function (obj) {
        return axios.get(`https://ual.geoplatform.gov/api/datasets/${obj.id}`)
            .then(function (response) {
                if (response.data.related) {
                    //console.log('GPRELATEDRECORDS DATA: ',response.data.modified);
                    gpDataset.data[gpDataset.data.findIndex(x => x.id === response.data.id)].gp_data_modified = response.data.modified;
                    gpDataset.data[gpDataset.data.findIndex(x => x.id === response.data.id)].related = response.data.related.filter(x_1 => x_1.mediaType && x_1.mediaType === 'text/html');
                }
            })
            .catch(function (error) {
                let err = { label: obj.label, id: obj.id, uri: obj.uri, err: error };
                console.log('getGPRelatedRecords() ERR: ', err);
            });
    }));
    resolve({ data: gpDataset.data});
});
const getDataDotGovRecords = (gpDataset) => new Promise((resolve, reject) => {
    //retrieves records from Data.gov that have a related record
    // and assigns the metadata_modified data to gpDataset.
    return Promise.all(gpDataset.data.filter(x => x.related && x.related.length > 0).map(function(obj){
        return axios.get(obj.related[0].href.replace('https://catalog.data.gov/dataset/', 'https://catalog.data.gov/api/3/action/package_show?id='))
          .then(function (response) {
            gpDataset.data[gpDataset.data.filter(x => x.related && x.related.length > 0).findIndex((x) =>
                x.related[0].href.includes(response.data.result.name)
            )].data_dot_gov_modified = Date.parse(response.data.result.metadata_modified);
          })
          .catch(function (error) {
            let err = {label: obj.label, id: obj.id, uri: obj.uri, err: error};
            console.log('getDataDotGovRecords() ERR: ', err);
          });
    })).then(() => {
        resolve({data: gpDataset.data});
    });
});
const compareDatasets = () => new Promise((resolve, reject) => {
    getGPDatasets().then((gpDataset) => {
        
        //resolve({msg: 'success', gpDataset});
        //Promise.all([getGPRelatedRecords(gpDataset), getDataDotGovRecords(gpDataset)]).then((values) => {
        getGPRelatedRecords(gpDataset).then((gpDataset) => {
            // resolve({msg: 'success', data: gpDataset});
            getDataDotGovRecords(gpDataset).then((gpDataset) => {
                resolve({msg: 'success', data: gpDataset});
            })
        });
    });
});
app.get('/compareData/', (req, res) => {
    console.log('comparing the data now');
    // const msg = test();
    // res.send('everything\'s cool '+ JSON.stringify(msg));
    compareDatasets().then((msg) => {
        //console.log("MSG: ", msg);
        res.send('everything\'s cool '+ JSON.stringify(msg));    
    });
});
// serve the homepage
app.get('/', (req, res) => {
    console.log('DIR_NAME: ', __dirname);
  res.sendFile(__dirname + '/index.html');
});