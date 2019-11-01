'use strict';

const ccxt = require('ccxt');
const app = require('../../server/server')
var ccxtMain = require('./../../bin/ccxt/ccxt-main');

module.exports = function(CoinInfo) {
  CoinInfo.updateDBCoinInfo = async function(coin_prices) {
    return new Promise((resolve, reject) => {
      const str = JSON.stringify(coin_prices);
      const data = {
        prices: str,
        timestamp: Date.now(),
        updateAt: Date.now(),
      }
      CoinInfo.create(data, (err, model) => {
        if (err) {
          return reject(err);
        } else {
          return resolve();
        }
      })
    })
  }

  CoinInfo.getInfoBefore24 = async function(coin_id, timestamp) {
    return new Promise((resolve, reject) => {
      const query = {
        where: {
          timestamp: {
            near: timestamp
          }
        }
      }
      CoinInfo.find(query, (err, prices) => {
        if (err) {
          return reject(err);
        } else {
          const prices = JSON.parse(prices);
          return prices[coin_id];
        }
      })
    })
  }


  CoinInfo.getAPICurrentPrice = function(symbol, time, limit, cb) {
    CoinInfo.getCurrentPrice(symbol, time, limit).then(function(curPrice) {
      if (curPrice < 0) {
        return cb(null, -1);
      }
      CoinInfo.getCurrentPrice(symbol, Date.now() - 1000 * 60 * time, limit).then(function(beforePrice) {
        let change = 0;
        if (beforePrice >= 0) change = curPrice - beforePrice;
        cb(null, {
          price: curPrice,
          change: change,
          updateAt: Date.now(),
        });
      }).catch(function(e) {
        console.log(e);
        throw(e);
      });
    }).catch(function(e) {
      console.log(e);
      throw(e);
    })
  }

  CoinInfo.getVWAPrice = function(symbol, time, limit) {
    return new Promise(function(resolve, reject) {
      const time_limit = Date.now() - 1000 * 60 * time;
      app.models.Trades.find({where: {symbol:symbol, timestamp: { gt: time_limit }}, limit: limit}, function(err, model_datas) {
        if (err) {
          console.log(err);
          return reject(err);
          // throw err;
        } else {
          let sum = 0;
          let amount = 0;
          let count = 0;
          for (let i = 0; i < model_datas.length; i ++) {
            const trades = JSON.parse(model_datas[i].data);
            const limit_num = Math.min(trades.length, limit);
            for (let k = 0; k < limit_num; k++) {
              const trade = trades[k];
              if (trade && trade.amount > 0 && trade.timestamp > time_limit) {
                sum += trade.price * trade.amount;
                amount += trade.amount;
                count++;
              }
            }
          }
          if (count > 0) {
            return resolve({
              price: sum / amount,
              count: count
            });
          } else {
            return resolve(-1);
          }
        }
      });
    })
  }

  CoinInfo.getCurrentPrice = function(symbol, time, limit) {
    return new Promise(function(resolve, reject) {
      let data = [];
      app.models.Trades.find({where: {symbol:symbol, timestamp: {gt: Date.now() - 1000 * 60 * time}}, limit: limit}, function(err, tickers) {
        if (err) {
          console.log(err);
          return reject(err);
          // throw err;
        } else {
          let sum = 0;
          let amount = 0;
          data = tickers;
          for (let i = 0; i < data.length; i ++) {
            if (data[i].amount > 0) {
              sum += data[i].price * data[i].amount;
              amount += data[i].amount;
            }
          }
          if (amount != 0) {
            return resolve(sum / amount);
          } else {
            return resolve(-1);
          }
        }
      });
    })
  }

  // CoinInfo.getAPICurPrice = function(symbol, time, limit, cb) {
  //   CoinInfo.getCurrentPrice(symbol, time, limit).then(function(curPrice) {
  //     if (curPrice < 0) {
  //       return cb(null, -1);
  //     }
  //     CoinInfo.getCurrentPrice(symbol, Date.now() - 1000 * 60 * time, limit).then(function(beforePrice) {
  //       let change = 0;
  //       if (beforePrice >= 0) change = curPrice - beforePrice;
  //       cb(null, {
  //         price: curPrice,
  //         change: change,
  //         updateAt: Date.now(),
  //       });
  //     }).catch(function(e) {
  //       console.log(e);
  //       throw(e);
  //     });
  //   }).catch(function(e) {
  //     console.log(e);
  //     throw(e);
  //   })
  // }

  CoinInfo.getCurrentVWAP = function(symbol, limit, time, cb) {
    (async() => {
      const result = await CoinInfo.getVWAPrice(symbol, limit, time)
      cb(null, result);
    })()
  }

  CoinInfo.getCoinInfo = function(symbol, cb) {
    (async() => {
      const cmc = new ccxt.coinmarketcap();
      const data = await cmc.fetchTicker(symbol);
      return cb(null, {
        circule_supply: data.info['total_supply'],
        available_supply: data.info['available_supply'],
        volume_24: data.info['24h_volume_usd'],
        change_1h: data.info['percent_change_1h'],
        change_24h: data.info['percent_change_1h'],
        change_24h: data.info['percent_change_1h'],
        rank: data.info['rank'],
        change: data['change'],
        price: data.vwap ? data.vwap : data.last,
      })
    })()
    // let data = [];
    // app.models.Tickers.find({where: {symbol:symbol}}, function(err, tickers) {
    //   if (err) {
    //     console.log(err);
    //     // return cb(null, -1);
    //     throw err;
    //   } else {
    //     let sum_market = 0;
    //     let sum_quoteVol = 0;
    //     let sum_baseVol = 0;
    //     tickers.map(ticker => {
    //       sum_quoteVol += (ticker.quoteVol ? ticker.quoteVol : 0);
    //       sum_baseVol += (ticker.baseVol ? ticker.baseVol : 0);
    //     })
    //     return cb(null, {
    //       quoteVol: sum_quoteVol,
    //       baseVol: sum_baseVol
    //     });
    //   }
    // });
  }

  CoinInfo.remoteMethod(
    'getAPICurrentPrice', {
      accepts: [
        { arg: 'symbol', type: 'string'},
        { arg: 'time', type: 'number'},
        { arg: 'limit', type: 'number'},
      ],
      description: [
        'get all ticker with specific symbol',
        'example: symbol = "BTC/USD"'
      ],
      http: { path: '/getprice', verb: 'post', errorStatus: 400},
      returns: { arg: 'res', type: 'object' }
    }
  )

  CoinInfo.remoteMethod(
    'getCurrentVWAP', {
      accepts: [
        { arg: 'symbol', type: 'string'},
        { arg: 'limit', type: 'number'},
        { arg: 'time', type: 'number'},
      ],
      description: [
        'get current vwap with specific symbol',
        'example: symbol = "BTC/USD"'
      ],
      http: { path: '/getwvap', verb: 'post', errorStatus: 400},
      returns: { arg: 'res', type: 'object' }
    }
  )

  CoinInfo.remoteMethod(
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
