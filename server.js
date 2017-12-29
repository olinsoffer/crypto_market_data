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
const fields = ['symbol', 'currency', 'bid', 'ask', ' latest_trade', 'n_trades', 'high', 'close', 'previous_close', 'volume', 'currency_volume', 'conversion'];
const fieldNames = ['Symbol', 'Currency', 'Bid', 'Ask', 'Latest trade', 'Number of trades', 'High', 'Close', 'Previous close', 'Volume', 'Currency volume', 'Conversion Rate'];
let counter = 0, marketData;

let getConversionData = () => {
    return new Promise((resolve, reject) => {
        request(curLayUrl, (err, res, body) => {
            if (err) {
                reject(err); return;
            }
            resolve(body);
        });
    });
}

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
        .then((marketRes) => {
            getConversionData()
                .then((conversionRes) => {
                    console.log(conversionRes);
                    conversionRes = JSON.parse(conversionRes);
                    try {
                        marketData = JSON.parse(marketRes)
                            .filter((val, index, arr) => {
                                return (val.bid && val.ask);
                            });
                        marketData.forEach((item, index, arr) => {
                            let currentCurrency = item.currency;
                            if (currentCurrency !== 'USD' && conversionRes.quotes['USD' + currentCurrency]) {
                                item.conversion = conversionRes.quotes['USD' + currentCurrency]
                            } else {
                                item.conversion = 'no data';
                            }
                        });
                        let csv = json2csv({ data: marketData, fields: fields, fieldNames: fieldNames });
                        console.log(csv);
                        let file = 'file' + counter + '.csv';
                        fs.writeFile(__dirname + '/csv/' + file, csv, (err) => {
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
//
app.listen(process.env.PORT || '8000', () => {
    console.log('Server is running on http://localhost:8000 or http://127.0.0.1:3000');
});


