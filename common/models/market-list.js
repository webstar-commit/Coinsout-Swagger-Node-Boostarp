'use strict';

const app = require('../../server/server');

const ccxt = require('ccxt');

module.exports = function(Marketlist) {
    Marketlist.marketInfo = function(id, symbol, cb) {
        let exchange = new (ccxt)[id]()
        exchange.loadMarkets()

        if (exchange.hasFetchOHLCV) {
            (async () => {
                let result = new Object();
                result.name = exchange.name;
                result.code = exchange.id;
                let OHLCV = await exchange.fetchOHLCV(symbol, '1m') // one minute
                let length = OHLCV.length;
                result.cur_price = (OHLCV[0][2] + OHLCV[0][3])/2;
                result.cur_vol = OHLCV[0][5];
                result.cur_price_1m = (OHLCV[length-1][2] + OHLCV[length-1][3]) / 2;
                result.cur_vol_1m = OHLCV[length-1][5];

                OHLCV = await exchange.fetchOHLCV(symbol, '15m') // one minute
                length = OHLCV.length;
                result.cur_price_15m = (OHLCV[length-1][2] + OHLCV[length-1][3]) / 2;
                result.cur_vol_15m = OHLCV[length-1][5];

                OHLCV = await exchange.fetchOHLCV(symbol, '30m') // one minute
                length = OHLCV.length;
                result.cur_price_30m = (OHLCV[length-1][2] + OHLCV[length-1][3]) / 2;
                result.cur_vol_30m = OHLCV[length-1][5];

                OHLCV = await exchange.fetchOHLCV(symbol, '1h') // one minute
                length = OHLCV.length;
                result.cur_price_1h = (OHLCV[length-1][2] + OHLCV[length-1][3]) / 2;
                result.cur_vol_1h = OHLCV[length-1][5];

                OHLCV = await exchange.fetchOHLCV(symbol, '1d') // one minute
                length = OHLCV.length;
                result.cur_price_1d = (OHLCV[length-1][2] + OHLCV[length-1][3]) / 2;
                result.cur_vol_1d = OHLCV[length-1][5];
                return cb(null, result);
            }) ()
        } else {
            return cb(null, ['error'])
        }
    }

    Marketlist.remoteMethod(
        'marketInfo', {
            accepts: [
                {arg: 'exchange', type: 'string'},
                {arg: 'symbol', type: 'string'}
            ],
            description: [
                'get detail market info within timeframe'
            ],
            http: {path: '/marketInfo', verb: 'get'},
            returns: {arg: 'res', type: 'object'}
        }
    )
};
