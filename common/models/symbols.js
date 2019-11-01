'use strict';

module.exports = function(Symbols) {
  const ccxt = require('ccxt');

  Symbols.resetAllSymbols = function(cb) {
    (async() => {
      const symbols = [];
      let count = 0;
      // let exchanges = {};
      await Promise.all(ccxt.exchanges.map(async id => {
        try {
          let exchange = new (ccxt)[id]();
          await exchange.loadMarkets();
          // exchanges[id] = exchange;
          if (exchange.symbols)
            symbols.push(exchange.symbols);
          count++;
        } catch(e) {
          if (e instanceof ccxt.DDoSProtection) {
            console.log(e.message, '[DDoS Protection]')
          } else if (e instanceof ccxt.RequestTimeout) {
            console.log(e.message, '[Request Timeout]')
          } else if (e instanceof ccxt.AuthenticationError) {
            console.log(e.message, '[Authentication Error]')
          } else if (e instanceof ccxt.ExchangeNotAvailable) {
            console.log(e.message, '[Exchange Not Available]')
          } else if (e instanceof ccxt.ExchangeError) {
            console.log(e.message, '[Exchange Error]')
          } else if (e instanceof ccxt.NetworkError) {
            console.log(e.message, '[Network Error]')
          } else {
            // throw e;
          }
        }
      }))

      // let uniqueSymbols = ccxt.unique(ccxt.flatten(ccxt.exchanges.map(id => exchanges[id].symbols)))
      let uniqueSymbols = ccxt.unique(ccxt.flatten(symbols));
      const data = [];
      for (let i = 0; i < uniqueSymbols.length; i++) {
        data.push({
          'symbol': uniqueSymbols[i]
        })
      }
      Symbols.create(data, (err, model) => {
        if (err) {
          console.log(err);
          throw err;
        } else {
          cb(null, uniqueSymbols.length);
        }
      });
    })()
  }


  Symbols.remoteMethod(
    'resetAllSymbols', {
        accepts: [],
        description: [
          'set All symbols data'
        ],
        http: { path: '/resetallsymbols', verb: 'post'},
        returns: { arg: 'res', type: 'string' }
    }
  )
};
