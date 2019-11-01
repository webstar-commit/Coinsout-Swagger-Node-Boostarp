'use strict';

const ccxt = require('ccxt');

module.exports = function(Marketwrapper) {
  Marketwrapper.getCoinInfo = function(symbol, cb) {
    (async() => {
      const cmc = new ccxt.coinmarketcap();
      const tickers = await cmc.fetchTickers();
      const keys = Object.keys(tickers);
      let data = [];
      await Promise.all(keys.map(async key => {
        const ticker = tickers[key];
        data.push({
          symbol: ticker.symbol,
          price: ticker.last,
          change: ticker.change,
          updateAt: ticker.datetime,
        });
      }));
      cb(null, data);
    })()
  }

  Marketwrapper.remoteMethod(
    'getCoinInfo', {
      accepts: [
        { arg: 'symbol', type: 'string'},
      ],
      description: [
        'get Information with specific symbol',
        'example: symbol = "BTC/USD"'
      ],
      http: { path: '/getcoininfo', verb: 'post', errorStatus: 400},
      returns: { arg: 'res', type: 'object' }
    }
  )
};
