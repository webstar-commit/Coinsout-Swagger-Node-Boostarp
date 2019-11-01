'use strict';

module.exports = {
  main: function(app) {
    console.log('-----');
    const main = new COrderFetch(app);
    main.startFetching(app);
  },
};

const ccxt = require('ccxt');
const async = require('async');
const fs = require ('fs')
const verbose = false
const debug = false
const enableRateLimit = true
const keysGlobal = './keys.json'
const keysLocal = 'keys.local.json'
const keysFile = fs.existsSync (keysLocal) ? keysLocal : keysGlobal

class COrderFetch {
  constructor(app) {
    this.app = app;
    // this.lastStampTimes = {};
    this.counts = {};
    this.symbolCnt = 0;
  }

  startFetching(app) {
    const self = this;
    setInterval(function() {
      (async() => {
        app.models.FetchOrders.removeOrdersWithTimeout(1000 * 60 * 60 * 24);
      })()
    }, 1000 * 60 * 60 * 1);
    // const objects = ['_1btcxe'];
    // async.forEachOf(objects, (id, key, callback) => {
    async.forEachOf(ccxt.exchanges, (id, key, callback) => {
      (async() => {
        let settings = require(keysFile)[id] || {}
        if (!settings.disable) {
          let exchange = new (ccxt)[id] ({
            verbose,
            enableRateLimit,
            debug,
            timeout: 20000,
          })
          Object.assign (exchange, settings);
          // const markets = await exchange.loadMarkets();
          if (exchange.markets && exchange.hasFetchTrades && exchange.hasFetchOrderBook) {
            // self.lastStampTimes[exchange.id] = {};
            self.counts[exchange.id] = 0;
            let timestamp = 0;
            while(true) {
              timestamp = Date.now();
              await self.startFetchAllOrders(exchange);
              self.counts[exchange.id] = self.counts[exchange.id] + 1;
              timestamp = Date.now() - timestamp;
              // await sleep(300000 - timestamp);
            }
          }
        }
      })()
    }, err => {
        if (err) console.error(err.message);
    });
  }

  async startFetchAllOrders(exchange) {
    try {
      console.log('*****startFetch******', exchange.id);
      await this.fetchAllOrders(exchange);
      console.log('###################finish', exchange.id);
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
        console.log(e);
        // throw e;
      }
    }
  }

  async fetchAllOrders(exchange) {
    let timestamp = Date.now();
    // await Promise.all(exchange.symbols.map(async symbol => {
    for (let i = 0; i < exchange.symbols.length; i++) {
      const symbol = exchange.symbols[i];
      timestamp = Date.now() - timestamp;
      if (exchange.rateLimit > timestamp)
        await sleep(exchange.rateLimit - timestamp);

      // console.log('###', exchange.id, symbol);
      const orders = await exchange.fetchL2OrderBook(symbol, {
        'limit_bids': 1,
        'limit_asks': 1,
        'group': 1,
        'depth': 10
      });
      // console.log('###222', exchange.id, symbol);
      await this.app.models.FetchOrders.createDBTrades(exchange.id, symbol, orders);
    // }

      const trades = await exchange.fetchTrades(symbol, undefined, 1);
      let low_limit, high_limit;
      if (trades.length > 0) {
        low_limit = trades[0].price * 0.9;
        high_limit = trades[0].price * 1.1;
        // const orders = await exchange.fetchL2OrderBook(symbol);
        const orders = await exchange.fetchL2OrderBook(symbol, {
          'limit_bids': 1,
          'limit_asks': 1,
          'group': 1,
          'depth': 10
        });

        //testing
        // await this.app.models.FetchOrders.createDBTrades(exchange.id, symbol, orders);
        // continue;
        // let orders = await exchange.fetchOrderBook (symbol)
        // let bid = orders.bids.length ? orders.bids[0][0] : undefined
        // let ask = orders.asks.length ? orders.asks[0][0] : undefined
        // let spread = (bid && ask) ? ask - bid : undefined
        // console.log (exchange.id, 'market price', { bid, ask, spread })
        if (orders) {
          let bid_count = 0;
          let ask_count = 0;
          orders.bids.map(bid => {
            if (low_limit <= bid[0] && bid[0] <= high_limit) {
              bid_count++;
            }
          })
          orders.asks.map(ask => {
            if (low_limit <= ask[0] && ask[0] <= high_limit) {
              ask_count++;
            }
          })
          const sum = bid_count + ask_count;
          let ask, bid;
          if (sum > 0) {
            bid = bid_count / sum;
            ask = ask_count / sum;
            let data = {
              exchange: exchange.id,
              symbol: symbol,
              bid: bid,
              ask: ask,
              updateAt: orders.timestamp,
              timestamp: Date.now(),
            }

            if (data.exchange && data.symbol) {
              await this.updateDBOrder(data);
              this.symbolCnt++;
              console.log('********', this.counts[exchange.id], this.symbolCnt, exchange.id, symbol, '------');
            }
            data = [];
          }
        }
      }
    }
  }

  updateDBOrder(order) {
    const self = this;
    return new Promise((resolve, reject) => {
      if (order.exchange && order.symbol) {
        self.app.models.orders.upsertWithWhere({exchange: order.exchange, symbol: order.symbol}, order, (err, model) => {
          if (err) {
            return reject(err);
          } else {
            return resolve();
          }
        });
      }
    });
  }

}


let sleep = (ms) => new Promise (resolve => setTimeout (resolve, ms))
