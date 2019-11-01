'use strict';

var ccxtFetch = require('./ccxt-fetch');
var ccxtFetchOrders = require('./ccxt-fetchorders');
var ccxtFetchTrades = require('./ccxt-fetchtrades');
var dataGroup = require('./ccxt-group');
const ccxt = require('ccxt');


module.exports = {
  main: function(app) {
    console.log('-----');
    const main = new CDataMan(app);
    // ccxtFetch.main(main);
    // ccxtFetchOrders.main(app);
    // ccxtFetchTrades.main(app);
    // dataGroup.main(app);

    // app.models.Ticket24.resetAllData();
    // (async() => {
    // app.models.Ticket24.updateCoin24Info();
    // app.models.ArbitrageTable.resetAll();
        // await app.models.FiatCurrency.resetAllCurrency();
    // })()
    // app.models.FiatCurrency.resetAllCurrency();
    // app.models.CoinMarketCap.startUpdateCoinMarketCap();
  },

  getVWAPWithSymbol: async function(symbol, limit) {
    return await ccxtFetch.getVWAPWithSymbol(symbol, limit);
  }
};


class CDataMan {
  constructor(app) {
    this.app = app;
    this.ds = app.datasources.coinscout;
    this.models = app.models;
  }

  start() {
    (async() => {
      const cmc = new ccxt.coinmarketcap();
      while(true) {
        await this.fetchMarketCoin(cmc);
        sleep(1000);
      }
    })()
  }

  // async fetchMarketCoin(cmc) {
  //   try {
  //     const tickers = await cmc.fetchTickers();
  //     const keys = Object.keys(tickers);
  //     await Promise.all(keys.map(async key => {
  //       const ticker = tickers[key];
  //       const data = {
  //         symbol: ticker.symbol,
  //         price: ticker.last,
  //         change: ticker.change,
  //         updateAt: ticker.datetime,
  //       }
  //       await this.app.models.CoinPrice.updateData(data);
  //     }));
  //   } catch(e) {
  //     if (e instanceof ccxt.DDoSProtection) {
  //       console.log(e.message, '[DDoS Protection]')
  //     } else if (e instanceof ccxt.RequestTimeout) {
  //       console.log(e.message, '[Request Timeout]')
  //     } else if (e instanceof ccxt.AuthenticationError) {
  //       console.log(e.message, '[Authentication Error]')
  //     } else if (e instanceof ccxt.ExchangeNotAvailable) {
  //       console.log(e.message, '[Exchange Not Available]')
  //     } else if (e instanceof ccxt.ExchangeError) {
  //       console.log(e.message, '[Exchange Error]')
  //     } else if (e instanceof ccxt.NetworkError) {
  //       console.log(e.message, '[Network Error]')
  //     } else {
  //         throw e;
  //     }
  //   }
  // }


  updateDBTicker(ticker) {
    return new Promise((resolve, reject) => {
      // setTimeout(() => {
      //   resolve();
      //   console.log('aaaaaaaa');
      // }, 10)
      if (ticker.exchange && ticker.symbol) {
        this.app.models.Tickers.upsertWithWhere({exchange:ticker.exchange, symbol:ticker.symbol}, ticker, (err, model) => {
          if (err) {
            console.log(err, ticker.exchange, ticker.symbol);
            return reject(err);
            throw err;
          }

          // console.log(ticker.exchange, ticker.symbol);
          return resolve();
        });
      }
    });
  }

  updateDBTrades(trade) {
    return new Promise((resolve, reject) => {
      this.app.models.FetchTrades.create(trade, (err, model) => {
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


  // updateDBCoinPrice(symbol) {
  //   console.log(symbol);
  //   const self = this;
  //   return new Promise(function(resolve, reject) {
  //     self.app.models.CoinPrice.getCurrentPrice(symbol, 30, 2000)
  //     .then(function(price) {
  //       console.log(symbol, price);
  //       const obj = {
  //         symbol: symbol,
  //         price: price,
  //         updateAt: new Date().getTime()
  //       }
  //       self.app.models.CoinPrice.create(obj, function(err, model) {
  //         if (err) {
  //           console.log(err);
  //           reject(err);
  //         } else {
  //           console.log(obj);
  //           resolve(obj);
  //         }
  //       });
  //     })
  //     .catch(function(e) {
  //       reject(e);
  //     })
  //   });
  // }

}
