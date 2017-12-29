const express = require('express');
const path = require('path');
const app = express();
const json2csv = require('json2csv');
const fs = require('fs');
const request = require('request');
const bodyParser = require('body-parser');

app.use(express.static('node_modules'));
app.use(express.static('./csv'));
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));


let currencyLayerApiKey = '32e6b0b7c2f5e78fd35a229d3e59d3b0';
let curLayUrl = 'http://www.apilayer.net/api/live?access_key=' + currencyLayerApiKey;

let marketDataUrl = 'http://api.bitcoincharts.com/v1/markets.json';
const fields = ['symbol', 'currency', 'bid', 'ask', ' latest_trade', 'n_trades', 'high', 'close', 'previous_close', 'volume', 'currency_volume'];
let counter = 0, marketData;



let getMarketData = () => {
    return new Promise((resolve, reject) => {
        request(marketDataUrl, (err, res, body) => {
            if (err) {
                reject(err); return;
            }
            resolve(body);
        });
    });
}

function makeCsv(response) {
    getMarketData()
        .then((res) => {
            try {
                marketData = JSON.parse(res)
                    .filter((val, index, arr) => {
                        return (val.bid && val.ask);
                    });
                // .map()
                let csv = json2csv({ data: marketData, fields: fields });
                console.log(csv);
                let file = 'file' + counter + '.csv';
                fs.writeFile('./csv/' + file, csv, (err) => {
                    if (err) throw err;
                    console.log('file saved');
                    // return {file: file}
                    // let file = 'file' + counter + '.csv';
                    console.log(file);
                    counter++;
                    response.send(file);
                });
            } catch (err) {
                console.error(err);
            }
        });
}



app.get('/newcsv', (req, response) => {
    makeCsv(response);
});

app.get('/download/:fileName', (req, res) => {
    let fileName = req.params.fileName;
    let file = __dirname + '/csv/' + fileName;
    console.log(file);
    res.download(file);
});

app.listen(process.env.PORT || '8000', () => {
    console.log('Server is running on http://localhost:8000 or http://127.0.0.1:3000');
});


