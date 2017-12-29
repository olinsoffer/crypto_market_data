const express = require('express');
const path = require('path');
const app = express();
const json2csv = require('json2csv');
const fs = require('fs');
const request = require('request');


let currencyLayerApiKey = '32e6b0b7c2f5e78fd35a229d3e59d3b0';
let curLayUrl = 'http://www.apilayer.net/api/live?access_key='+currencyLayerApiKey;

let marketDataUrl = 'http://api.bitcoincharts.com/v1/markets.json';
const fields = ['symbol', 'currency', 'bid', 'ask', ' latest_trade', 'n_trades', 'high', 'close', 'previous_close', 'volume', 'currency_volume'];
let counter = new Date , marketData;

app.use(express.static('node_modules'));

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

function makeCsv() {
    getMarketData()
    .then((res) => {
        try {
            marketData = JSON.parse(res);
            let csv = json2csv({ data: marketData, fields: fields });
            console.log(csv);
            fs.writeFile('csv/file' + counter + '.csv', csv, function (err) {
                if (err) throw err;
                console.log('file saved');
                // counter++
            });
        } catch (err) {
            console.error(err);
        }
    });
}

makeCsv();

app.get('/', function (req, res, next) {
    let file = __dirname + `/csv/file`+counter + '.csv';
    res.download(file);
});

app.listen(process.env.PORT || '8000', () => {
	console.log('Server is running on http://localhost:8000 or http://127.0.0.1:3000');
});


