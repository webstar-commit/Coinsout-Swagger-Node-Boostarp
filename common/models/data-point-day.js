'use strict';
const request = require('request');
const app = require('../../server/server')

module.exports = function(Datapointday) {
  // get Exchange
  Datapointday.getExchangeWidthID = function(symbol, cb) {
    const query = {
      where: {
        symbol: symbol,
        timestamp: {
          gt: Date.now() - 1000 * 60 * 60 * 24
        }
      }
    }
    Datapointday.find(query, function(err, data) {
      if (err) {
        console.log(err);
      } else {
        return cb(null, data);
      }
    })
  }
  Datapointday.remoteMethod(
    'getExchangeWidthID', {
      accepts: [
        { arg: 'symbol', type: 'string' }
      ],
      description: [
        'get data points for a day'
      ],
      http: {path: '/getdata', verb: 'get'},
      returns: { arg: 'res', type: 'object' }
    }
  )

  Datapointday.getDataWithExchange = async function(param_exchange, timeIndex) {
    return new Promise((resolve, reject) => {
      const interval = (1000 * 60 * 15);
      let count = parseInt(Date.now() / interval);
      const lastTime = count * interval;
      const query = {
        order: 'symbol ASC',
        where: {
          timestamp: parseInt(lastTime - timeIndex * interval)
          // {
          //   gt: Date.now() - 1000 * 60 * 60 * 24
          // }
        }
      };
      Datapointday.find(query, function(err, trades) {
        if (err) {
          return reject(err);
        } else {
          let datas = {};
          let symbol;
          for (let i = 0; i < trades.length; i++) {
            const trade = trades[i];
            datas[trade.symbol] = trade;
          }
          let exResults = {};
          for (let symbol in datas) {
            const trade = datas[symbol];
            const exchanges = JSON.parse(trade.exchanges);
            for (let exchange in exchanges) {
              if (exchange == param_exchange) {
                exResults[symbol] = {};
                if (exchanges[exchange].amount > 0 && exchanges[exchange].volume) {
                  exResults[symbol] = {
                    volume: exchanges[exchange].volume,
                    price: exchanges[exchange].volume / exchanges[exchange].amount,
                  }
                }
                break;
              }
            }
          }
          return resolve(exResults);
        }
      })
    })
  }


};

