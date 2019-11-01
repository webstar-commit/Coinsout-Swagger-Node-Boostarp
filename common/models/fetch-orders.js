'use strict';

module.exports = function(FetchOrders) {
  FetchOrders.createDBTrades = async function(exchange, symbol, orders) {
    return new Promise((resolve, reject) => {
      let strAsk = '', strBid = '';
      let data = {
        exchange: exchange,
        symbol: symbol,
        asks: JSON.stringify(orders.asks),
        bids: JSON.stringify(orders.bids),
        datetime: orders.datetime,
        timestamp: orders.timestamp,
        createdAt: Date.now()
      }
      this.app.models.FetchOrders.create(data, (err, model) => {
        if (err) {
          console.log(err);
          return reject(err);
        } else {
          console.log('++++++', exchange, symbol, data.asks.length, data.bids.length)
          return resolve();
        }
      });
    });
  }

  FetchOrders.removeOrdersWithTimeout = async function(timelimit) {
    const self = this;
    return new Promise((resolve, reject) => {
      const query = {
        timestamp: {
          lt: Date.now() - timelimit
        }
      };
      console.log('removing...');
      FetchOrders.deleteAll(query, function(err, orders) {
        if (err) {
          console.log('removeOrdersWithTimeout read err: ', err);
          return reject(err);
        } else {
          console.log('removed orders:', orders);
          return resolve(orders.length);
        }
      });
    });
  }
};
