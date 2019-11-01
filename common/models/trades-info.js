'use strict';
const request = require('request');

module.exports = function(TradesInfo) {
  TradesInfo.getLastVWAP = function(symbol, cb) {
    let data = [];
    const query = {
      order: 'timestamp DESC',
      where: {
        'symbol': symbol,
      },
      limit: 2
    }
    TradesInfo.find(query, function(err, trades) {
      if (err) {
        console.log(err);
        cb(null, null);
      } else {
        let price, diff;
        if (trades.length > 0) {
          price = getTradeVwap(trades[0]);
          if (price && trades.length > 1) {
            diff = price - getTradeVwap(trades[1]);
            diff = diff / price;
          }
        }
        cb(null, {
          price: price,
          diff: diff
        })
      }
    });
  }

  TradesInfo.remoteMethod(
    'getLastVWAP', {
      accepts: [
        { arg: 'symbol', type: 'string'},
      ],
      description: [
        'get last price',
        'example: symbol = "BTC/USD"'
      ],
      http: { path: '/getcurvwap', verb: 'get', errorStatus: 400},
      returns: { arg: 'res', type: 'object' }
    }
  )

  // get OHLCV history
  TradesInfo.getOHLCV = function(symbol, time, cb) {
    let data = [];
    const query = {
      where: {
        'symbol': symbol,
        timestamp: {
          gt: Date.now() - 1000 * 60 * 60 * 24 * time
        }
      },
      limit: 200
    }
    TradesInfo.find(query, function(err, trades) {
      if (err) {
        console.log(err);
        cb(null, null);
      }
      else {
        cb(null, trades)
      }
    });
  }

  TradesInfo.remoteMethod(
    'getOHLCV', {
      accepts: [
        { arg: 'symbol', type: 'string'},
        { arg: 'time', type: 'number'},
      ],
      description: [
        'get OHCV',
        'example: symbol = "BTC/USD", time(unit:1day)'
      ],
      http: { path: '/getohlcv', verb: 'get', errorStatus: 400},
      returns: { arg: 'res', type: 'object' }
    }
  )

  TradesInfo.getLastCurrency = function(base, fiat, cb) {
    (async() => {
      const result = await getCurrency(base, fiat);
      cb(null, result);
    })()
  }

  TradesInfo.remoteMethod(
    'getLastCurrency', {
      accepts: [
        { arg: 'base', type: 'string'},
        { arg: 'fiat', type: 'string'},
      ],
      description: [
        'get last currencies',
        'example: base = "BTC", fiat = "USD"'
      ],
      http: { path: '/getlastcurrency', verb: 'get', errorStatus: 400},
      returns: { arg: 'res', type: 'object' }
    }
  )

  let getVwap = function(prices, volumes) {
    let amount = 0, sum = 0;
    for (let i = 0; i < prices.length; i++) {
      if (prices[i] > 0 && volumes[i] > 0) {
        amount += volumes[i] / prices[i];
        sum += volumes[i];
      }
    }
    if (amount) {
      return sum / amount;
    }
    return 0;
  }

  TradesInfo.asyncGetLastExchange = async function(exchange, symbol) {
    return new Promise((resolve, reject) => {
      let data = [];
      const query = {
        order: 'timestamp DESC',
        where: {
          exchange: exchange,
          symbol: symbol,
        },
        limit: 2
      }
      TradesInfo.find(query, function(err, trades) {
        if (err) {
          console.log(err);
          return reject(err);
        } else {
          let price, diff = 0;
          if (trades.length > 0) {
            price = getVwap([trades[0].price_sell, trades[0].price_buy], [trades[0].volume_sell, trades[0].volume_buy]);
            if (price && trades.length > 1) {
              diff = price - getVwap([trades[1].price_sell, trades[1].price_buy], [trades[1].volume_sell, trades[1].volume_buy]);
              diff = diff / price;
            }
            return resolve({
              price: price,
              change: diff
            });
          } else {
            return resolve(null);
          }
        }
      })
    })
  }

  async function getCurrency(base_name, fiatCurrency) {
    try {
      let diff;
      const data = await getLastVWAPBySymbol('BTC', 'USD');
      const priceBTC_USD = data.price;
      const btc = await getLastVWAPBySymbol(base_name, 'BTC');
      let price = await convertFiatCurrency(btc.price * priceBTC_USD, fiatCurrency);
      const etc = await getLastVWAPBySymbol(base_name, 'ETC');
      if (base_name == 'BTC') {
        diff = data.diff;
      } else {
        diff = btc.diff;
      }
      return {
        price: price,
        diff: diff,
        btc_rate: btc.price,
        btc_diff: btc.diff,
        etc_rate: etc.price,
        etc_diff: etc.diff,
      }
    } catch(err) {
      console.log(err);
    }
  }

  let getLastVWAPBySymbol = async function(base, quote) {
    if (base == quote) {
      return {
        price: 1,
        diff: 0
      }
    }
    return new Promise((resolve, reject) => {
      const symbol = base + '/' + quote;
      TradesInfo.getLastVWAP(symbol, function(err, result) {
        if (err) {
          return reject(err);
        } else {
          return resolve(result);
        }
      })
    })
  }

  async function convertFiatCurrency(priceusd, fiatCurrency) {
    if (fiatCurrency == 'usd') {
      return priceusd;
    }
    return new Promise((resolve, reject) => {
      const forexUrl = 'https://dev.kwayisi.org/apis/forex/usd/' + fiatCurrency;
      request(forexUrl, { json: true }, (err, res, body) => {
        if (err) {
          return reject(err);
        }
        if (body.error)
          return resolve(0);
        return resolve(priceusd * body.rate);
      });
    });
  }

  let getTradeVwap = function(trade) {
    let amount_buy = 0, amount_sell = 0;
    if (trade.price_buy) {
      amount_buy = trade.volume_buy / trade.price_buy;
    }
    if (trade.price_sell) {
      amount_sell = trade.volume_sell / trade.price_sell;
    }
    return (trade.volume_buy + trade.volume_sell) / (amount_buy + amount_sell);
  }
}
