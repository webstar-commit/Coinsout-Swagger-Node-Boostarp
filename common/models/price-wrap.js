'use strict';

module.exports = function(Pricewrap) {
  Pricewrap.getOneTicker = function(exchange, symbol, cb) {
    var loopback = require('loopback');
var app = loopback();
var aaa = app.models.Tickers;
    // (async() => {
    //   let ticker = await getOneTicker(exchange, symbol);
    //   cb(null, ticker);
    // })()
  };

  Pricewrap.getAllTicker = function(symbol, cb) {
    (async() => {
      let res = await getAllTicker(symbol);
      cb(null, res);
    })()
  };

  Pricewrap.remoteMethod(
    'getOneTicker', {
      accepts: [
        { arg: 'exchange', type: 'string'},
        { arg: 'symbol', type: 'string'}
      ],
      description: [
        'get one ticker from specific exchange',
        'example: exchange = "bitfinex", symbol = "BTC/USD"'
      ],
      http: { path: '/getticker', verb: 'post'},
      returns: { arg: 'ticker', type: 'string' }
    }
  );

  Pricewrap.remoteMethod(
    'getAllTicker', {
      accepts: [
        { arg: 'symbol', type: 'string'}
      ],
      description: [
        'get all ticker with specific symbol',
        'example: symbol = "BTC/USD"'
      ],
      http: { path: '/getallticker', verb: 'post'},
      returns: { arg: 'res', type: 'array' }
    }
  );
};


const ccxt = require('ccxt');
async function getAllTicker(symbol) {
  let exchanges = []
  let results = []
  // instantiate all exchanges
  await Promise.all (ccxt.exchanges.map (async id => {
    let exchange = new (ccxt)[id] ()
    exchanges.push(exchange)
    let res = await getTickerAtExchange(exchange, symbol)
    if (res)
      results.push(res);
  }))

  let succeeded = exchanges.filter (exchange => exchange.markets ? true : false).length.toString ()
  let failed = exchanges.filter (exchange => exchange.markets ? false : true).length
  let total = ccxt.exchanges.length.toString ()
  console.log(succeeded, 'of', total, 'exchanges loaded', ('(' + failed + ' errors)'))
  return results;
}

let getTickerAtExchange = async function(exchange, symbol) {
  try {
    await exchange.loadMarkets()
    if (symbol in exchange.markets) {
      let ticker = await exchange.fetchTicker(symbol)
      return {
        id: exchange.id,
        symbol: symbol,
        high: human_value(ticker['high']),
        low: human_value(ticker['low']),
        bid: human_value(ticker['bid']),
        ask: human_value(ticker['ask']),
        volume: human_value(ticker['quoteVolume']),
        updateAt: ticker['datetime']
      }
    } else {
    }
  } catch (e) {
    if (e instanceof ccxt.DDoSProtection) {
      console.log(exchange.id, '[DDoS Protection]')
    } else if (e instanceof ccxt.RequestTimeout) {
      console.log(exchange.id, '[Request Timeout]')
    } else if (e instanceof ccxt.AuthenticationError) {
      console.log(exchange.id, '[Authentication Error]')
    } else if (e instanceof ccxt.ExchangeNotAvailable) {
      console.log(exchange.id, '[Exchange Not Available]')
    } else if (e instanceof ccxt.ExchangeError) {
      console.log(exchange.id, '[Exchange Error]')
    } else if (e instanceof ccxt.NetworkError) {
      console.log(exchange.id, '[Network Error]')
    } else {
        throw e;
    }
  }
}

// function getOneTicker(id, symbol) {
//   const ccxt = require('ccxt');
//   (async () => {
//     const ticker = await getTicker(ccxt, id, symbol);
//   }) ()
// }

let human_value = function (price) {
  return typeof price == 'undefined' ? 'N/A' : price
}

let sleep = (ms) => new Promise (resolve => setTimeout (resolve, ms))

async function getOneTicker(id, symbol) {
  // instantiate the exchange by id
  let verbose = false;
  let enableRateLimit = true;
  let debug = false;
  let exchange = new ccxt[id] ({
    verbose,
    enableRateLimit,
    debug,
    timeout: 20000,
  })
  let markets = await exchange.loadMarkets ()

  let ticker = await exchange.fetchTicker (symbol)
  console.log(exchange.id, symbol, 'ticker',
      ticker['datetime'],
      'high: '    + ticker['high'],
      'low: '     + ticker['low'],
      'bid: '     + ticker['bid'],
      'ask: '     + ticker['ask'],
      'volume: '  + ticker['baseVolume'])
  return ticker
}
