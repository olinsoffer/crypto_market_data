const express = require('express');
const path = require('path');
const app = express();
const json2csv = require('json2csv');
const fs = require('fs');
const request = require('request');
const bodyParser = require('body-parser');
const fx = require('money');

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

const fields = ['symbol', 'currency', 'bid', 'ask', 'high', 'close', 'volume', 'currency_volume', 'conversion', 'usd_bid_val', 'usd_ask_val'];
const fieldNames = ['Symbol', 'Currency', 'Bid', 'Ask', 'High', 'Close', 'Volume', 'Currency volume', 'Conversion Rate', 'USD Bid Value', 'USD Ask Value'];

let inactiveMarkets = require('./inactivemarkets.js'),
    counter = 0, marketData;

let fxInit = (data) => {
    data = JSON.parse(data);
    let rateKeys = Object.keys(data.quotes),
        rates = {};
    rateKeys.forEach((item, index, arr) => {
        rates[item.substr(3)] = data.quotes[item];
    });

    if (typeof fx !== 'undefined' && fx.rates) {
        fx.rates = rates;
        fx.base = data.source;
    } else {
        // If not, apply to fxSetup global:
        var fxSetup = {
            rates: rates,
            base: data.source
        }
    }
}

let getConversionData = (callback) => {
    request(curLayUrl, (err, res, data) => {
        if (err) {
            console.error(err); return;
        }
        fxInit(data);
        callback();
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

let roundNumberProps = function (obj) {
    let keys = Object.keys(obj);
    keys.forEach((key, index, arr) => {
        if (typeof obj[key] === 'number') {
            obj[key] = Math.round(obj[key] * 100) / 100;
        }
    });
};




let formatData = (callback) => {
    getMarketData()
        .then((marketRes) => {
            getConversionData(() => {
                marketData = JSON.parse(marketRes)
                    .filter((val, index, arr) => {
                        let symbol = val.symbol;
                        return (val.bid && val.ask && !inactiveMarkets[symbol]);
                    });

                marketData.forEach((item, index, arr) => {
                    let currentCurrency = item.currency;
                    if (currentCurrency !== 'USD' && fx.rates[currentCurrency]) {
                        let conversion = fx.convert(1, { from: currentCurrency, to: 'USD' });
                        __assignConversionVals(item, 1, conversion);
                    } else if (currentCurrency === 'USD') {
                        __assignConversionVals(item, 0, 'N/A');

                    } else {
                        __assignConversionVals(item, 0, 'no data');
                    }
                    roundNumberProps(item);
                });

                callback();
            });
        });

    function __assignConversionVals(item, option, val) {
        if (option === 0) {
            item.conversion = val;
            item.usd_bid_val = val;
            item.usd_ask_val = val;
        } else if (option === 1) {
            item.conversion = val;
            item.usd_bid_val = item.bid * item.conversion;
            item.usd_ask_val = item.ask * item.conversion;
        }
    };
};



function makeCsv(response) {
    formatData(() => {
        let csv = json2csv({ data: marketData, fields: fields, fieldNames: fieldNames });
        let file = 'file' + counter + '.csv';
        fs.writeFile(__dirname + '/csv/' + file, csv, (err) => {
            if (err) throw err;
            counter++;
            response.send(file);
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