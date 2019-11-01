
'use strict';

module.exports = {
  main: function(app) {
    console.log('-----');
    const main = new CFetching(app);
    main.startFetching();
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

const isWriteDataBase = true;

class CFetching {
  constructor(app) {
    this.app = app;
    this.lastStampTimes = {};
    this.counts = {};
    this.symbolCnt = 0;
  }

  startFetching() {
    const self = this;
    let index = 1;
    // const objects = ['kraken'];
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
          try {
            const markets = await exchange.loadMarkets();
          } catch (err) {
            console.log(err);
            if (isWriteDataBase)
              await this.app.models.ErrorCCXT.updateDBError('fetchTrades', exchange.id, 'exchange loadMarkets error', e.message);
            return;
          }

          await sleep(1000 * 10 * index);
          index++;

          if (exchange.id == 'bitstamp1') {
            exchange.symbols = ['BTC/USD'];
          }
          if (exchange.markets && exchange.hasFetchTrades) {
            self.lastStampTimes[exchange.id] = {};
            self.counts[exchange.id] = 0;
            let timestamp = 0;
            while(true) {
              timestamp = Date.now();
              const err = await self.startFetchAllTrades(exchange);
              if (err) {
                await sleep(1000 * 60 * 10);
                // break;
              }
              self.counts[exchange.id] = self.counts[exchange.id] + 1;
              timestamp = Date.now() - timestamp;
              // console.log('--- finish ----');
              // sleep(60000 - timestamp);
            }
          }
        }
      })()
    }, err => {
        if (err) console.error(err.message);
    });
  }

  async startFetchAllTrades(exchange) {
    try {
      // console.log('*****startFetch******', exchange.id);
      await this.fetchAllTrades2(exchange);
      // console.log('###################finish', exchange.id);
    } catch(e) {
      let errContent;
      if (e instanceof ccxt.DDoSProtection) {
        errContent = 'DDoS Protection';
      } else if (e instanceof ccxt.RequestTimeout) {
        errContent = '[CCXT] Request Timeout';
      } else if (e instanceof ccxt.AuthenticationError) {
        errContent = '[CCXT] Authentication Error';
      } else if (e instanceof ccxt.ExchangeNotAvailable) {
        errContent = '[CCXT] Exchange Not Available';
      } else if (e instanceof ccxt.ExchangeError) {
        errContent = '[CCXT] Exchange Error';
      } else if (e instanceof ccxt.NetworkError) {
        errContent = '[CCXT] Network Error';
      } else {
        errContent = e.message;
        // throw e;
      }
      console.log(e.message, errContent);
      if (isWriteDataBase)
        await this.app.models.ErrorCCXT.updateDBError('fetchTrades', exchange.id, errContent, e.message);
      return e;
    }
  }

  async fetchAllTrades2(exchange) {
    let timestamp = Date.now();
    for (let i = 0; i < exchange.symbols.length; i++) {
      const symbol = exchange.symbols[i];
      timestamp = Date.now() - timestamp;
      if (exchange.rateLimit > timestamp)
        await sleep(exchange.rateLimit - timestamp);

      let lastTime = this.lastStampTimes[exchange.id][symbol];
      if (!lastTime) {
        lastTime = Date.now() - 1000 * 60 * 60;
      }
      let trades;
      try {
       trades = await exchange.fetchTrades(symbol, lastTime, 1000);
      } catch(e) {
        console.log(e.message);
        continue;
      }
      console.log(exchange.id, symbol, trades.length)

      if (trades && trades.length > 0) {
        this.lastStampTimes[exchange.id][symbol] = trades[0].timestamp;

        //testing
        if (isWriteDataBase)
         await this.app.models.FetchTrades.createDBTrades(exchange.id, symbol, trades);

        let price_vwap_sell, volume_sell = 0;
        // let price_high_sell = 0, price_low_sell = Number.MAX_SAFE_INTEGER;
        let price_vwap_buy, volume_buy = 0;
        let price_high = 0, price_low = Number.MAX_SAFE_INTEGER;
        let timeAt_sum = 0;
        let amount_sell = 0, amount_buy = 0;
        let price_open, open_timestamp = Number.MAX_SAFE_INTEGER, price_close, close_timestamp = 0;
        // if (symbol == 'BTC/USD') {
        //   console.log('++++++++++++++');
        // }
        let sum = 0;
        trades.map(trade => {
          sum += trade.price;
        });
        const average = sum / trades.length;
        for (let k = 0; k < trades.length; k++) {
          const trade = trades[k];
          if (symbol == 'BTC/USD') {
            // console.log(trade);
            if (trade.price > 30000)
              continue;
          }
          if (trade.price > average * 2) {
            continue;
          }
          price_high = price_high > trade.price ? price_high : trade.price;
          price_low = price_low < trade.price ? price_low : trade.price;
          if (trade.side == 'buy') {
            volume_buy += trade.amount * trade.price;
            amount_buy += trade.amount;
          } else {
            volume_sell += trade.amount * trade.price;
            amount_sell += trade.amount;
          }
          timeAt_sum += trade['timestamp'] / 1000;

          if (close_timestamp < trade.timestamp) {
            close_timestamp = trade.timestamp;
            price_close = trade.price;
          }
          if (open_timestamp > trade.timestamp) {
            open_timestamp = trade.timestamp;
            price_open = trade.price;
          }
        }
        if (amount_buy > 0) {
          price_vwap_buy = volume_buy / amount_buy;
        }
        if (amount_sell > 0) {
          price_vwap_sell = volume_sell / amount_sell;
        }
        if (price_high == 0) {
          price_high = undefined;
        }
        if (price_low == Number.MAX_SAFE_INTEGER) {
          price_low = undefined;
        }
        if (isWriteDataBase) {
          await this.updateDBTrades({
            exchange: exchange.id,
            symbol: symbol,
            open: price_open,
            close: price_close,
            price_buy: price_vwap_buy,
            price_sell: price_vwap_sell,
            high: price_high,
            low: price_low,
            volume_buy: volume_buy,
            volume_sell: volume_sell,
            updateAt: parseInt(timeAt_sum / trades.length * 1000),
            timestamp: Date.now(),
            version: 1.0
          });
        }
      } else {
        this.lastStampTimes[exchange.id][symbol] = Date.now();
      }
    }
  }

  updateDBTrades(trade) {
    return new Promise((resolve, reject) => {
      this.app.models.TradesInfo.create(trade, (err, model) => {
        if (err) {
          console.log(err);
          reject(err);
          throw err;
        } else {
          resolve();
        }
      });
    });
  }

}


let sleep = (ms) => new Promise (resolve => setTimeout (resolve, ms))
