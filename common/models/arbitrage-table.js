
'use strict';
const ccxt = require('ccxt');
const app = require('../../server/server')

module.exports = function(ArbitrageTable) {

  ArbitrageTable.setArbitrage = async function(exchanges, currency, market) {
    if (currency == market) {
      return 0;
    }
    let results = [];
    const symbol = currency + '/' + market;
    await Promise.all(exchanges.map(async exchange => {
      if (exchange.symbols) {
        const symbols = JSON.parse(exchange.symbols);
        if (symbols.indexOf(symbol) >= 0) {
          const result = await app.models.TradesInfo.asyncGetLastExchange(exchange.exchange_id, symbol);
          if (result) {
            result.exchange = exchange.exchange_id;
            result.exchange_vol = exchange.volume24;
            results.push(result);
          }
        }
      }
    }))
    if (results.length > 0) {
      await ArbitrageTable.updateDB(currency, market, results);
    }
    return results.length;
  }

  ArbitrageTable.updateDB = async function(currency, market, results) {
    return new Promise((resolve, reject) => {
      const data = {
        currency: currency,
        market: market,
        result: JSON.stringify(results),
        timeStamp: Date.now()
      }
      ArbitrageTable.upsertWithWhere({currency: currency, market: market}, data, (err, model) => {
        if (err) {
          return reject(err);
        } else {
          return resolve(results.length);
        }
      })
    })
  }

  ArbitrageTable.resetAll = async function() {
    const currencies = ['BTC', 'ETH', 'XRP', 'BCH', 'NEO', 'ADA', 'ETH', 'EOS', 'LTC', 'XLM'];
    const markets = ['USD', 'EUR', 'BTC', 'ETH'];
    const exchanges = await app.models.Exchanges.asyncGetAllExchanges();
    for (let i = 0; i < currencies.length; i++) {
      for (let k = 0; k < markets.length; k++) {
        let len = await ArbitrageTable.setArbitrage(exchanges, currencies[i], markets[k]);
        console.log('+++', currencies[i], '/', markets[k], len);
      }
    }
  }

  ArbitrageTable.getArbitrage = function(currency, market, cb) {
    const query = {
      where: {
        currency: currency,
        market: market
      }
    }
    ArbitrageTable.find(query, function(err, data) {
      if (err) {
        console.log(err);
      } else {
        if (data.length > 0) {
          return cb(null, data[0]);
        } else {
          return cb(null);
        }
      }
    })
  }

  ArbitrageTable.remoteMethod(
    'getArbitrage', {
      accepts: [
        {arg: 'currency', type: 'string'},
        {arg: 'market', type: 'string'},
      ],
      description: [
        'Arbitrage table just displays the price difference between last trades. example: currency="BTC", market="USD"'
      ],
      http: {path: '/getArbitrage', verb: 'get'},
      returns: {arg: 'res', type: 'object'}
    }
  )

};
