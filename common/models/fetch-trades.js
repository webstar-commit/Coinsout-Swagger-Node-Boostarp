'use strict';

const app = require('../../server/server')

module.exports = function(FetchTrades) {
  FetchTrades.getCurrentTrade = function(symbol, time, limit, cb) {
    let data = [];
    FetchTrades.find({where: {symbol:symbol, timestamp: {gt: Date.now() - 1000 * 60 * time}}, limit: limit}, function(err, tickers) {
      if (err) {
        console.log(err);
        throw err;
      }
      else {
        let sum = 0;
        let amount = 0;
        data = tickers;
        for ( var i = 0 ; i < data.length ; i ++ ) {
          if (data[i].amount > 0) {
            sum += data[i].price * data[i].amount;
            amount += data[i].amount;
          }
        }
        if (amount != 0) {
          return cb(null, sum/amount);
        }
        else {
          return cb(null, 0);
        }
      }
    });
  }

  FetchTrades.remoteMethod(
      'getCurrentTrade', {
          accepts: [
            { arg: 'symbol', type: 'string'},
            { arg: 'time', type: 'number'},
            { arg: 'limit', type: 'number'},
          ],
          description: [
            'get all ticker with specific symbol',
            'example: symbol = "BTC/USD"'
          ],
          http: { path: '/getcurrenttrade', verb: 'post', errorStatus: 400},
          returns: { arg: 'res', type: 'number' }
      }
  )


  FetchTrades.createDBTrades = async function(exchange, symbol, trades) {
    return new Promise((resolve, reject) => {
      let data = [];
      trades.map(trade => {
        data.push({
          p: trade.price - 0, // price
          a: trade.amount, // amount
          s: trade.side, // side
          // d: trade.datetime, // datetime
          t: new Date(trade.timestamp), // timestamp
        })
      })
      const res = {
        exchange: exchange,
        symbol: symbol,
        trades: data,
        createdAt: Date.now(),
      }
      this.app.models.FetchTrades.create(res, (err, model) => {
        if (err) {
          console.log(err);
          return reject(err);
        } else {
          return resolve();
        }
      });
    });
  }
};
