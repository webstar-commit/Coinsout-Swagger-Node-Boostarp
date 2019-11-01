'use strict';

const ccxt = require('ccxt');

module.exports = function(Tickers) {
  Tickers.resetAllTickers = function(cb) {
    (async() => {
      let count = 0;
      for (let index = 0; index < ccxt.exchanges.length; index++) {
        try {
          const id = ccxt.exchanges[index];
          let exchange = new (ccxt)[id]();
          await exchange.loadMarkets();
          if (exchange.markets && exchange.hasFetchTickers) {
            let tickers = await exchange.fetchTickers();
            const keys = Object.keys(tickers);
            if (keys) {
              for (let i = 0; i < keys.length; i++) {
                let ticker = tickers[keys[i]];
                if (ticker.symbol) {
                  // await updateDBTicker(exchange.id, ticker, dataMan);
                  await updateDBTicker({
                    exchange: exchange.id,
                    symbol: ticker['symbol'],
                    high: ticker['high'],
                    low: ticker['low'],
                    vwap: ticker['vwap'],
                    average: ticker['average'],
                    // ask: human_value(ticker['ask']),
                    baseVol: ticker['baseVolume'],
                    quoteVol: ticker['quoteVolume'],
                    change: ticker.change,
                    updateAt: ticker['datetime']
                  });
                  count++;
                }
                console.log('---end', exchange.id, count);
                ticker = null;
              }
            }
          }
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
            // throw e;
          }
        }
      }
      return cb(null, count);
    })()
  };

  async function updateDBTicker(ticker) {
    return new Promise((resolve, reject) => {
      if (ticker.exchange && ticker.symbol) {
        Tickers.upsertWithWhere({exchange:ticker.exchange, symbol:ticker.symbol}, ticker, (err, model) => {
          if (err) {
            console.log(err, ticker.exchange, ticker.symbol);
            return reject(err);
            throw err;
          }

          // console.log(ticker.exchange, ticker.symbol);
          return resolve();
        });
      }
    })
  }
  // Tickers.resetAllTickers();

  Tickers.remoteMethod(
      'resetAllTickers', {
          accepts: [
          ],
          description: [
              'reset all'
          ],
          http: {path: '/resetalltickers', verb:'post'},
          returns: {arg: 'res', type:'string'}
      }
  )

  Tickers.detailInfoByFilter = function(MarketCap, CirculSupply, Price, startNum, Limit, cb) {
      Tickers.find({where: {baseVol: {lt: MarketCap}, quoteVol: {lt: CirculSupply}, average: {lt: Price}}, skip: startNum, limit: Limit}, function(err, data) {
          return cb(null, data);
      })
  };
  Tickers.remoteMethod(
      'detailInfoByFilter', {
          accepts: [
            { arg: 'MarketCap', type: 'number'},
            { arg: 'CirculSupply', type: 'number'},
            { arg: 'Price', type: 'number'},
            { arg: 'startNum', type: 'number'},
            { arg: 'Limit', type: 'number'}
          ],
          description: [
            'get detail information by filter'
          ],
          http: { path: '/detailInfoByFilter', verb: 'get'},
          returns: { arg: 'res', type: 'array' }
      }
  )

  // getExchangesBySymbol
  Tickers.getExchangesBySymbol = function(symbol, cb) {
    Tickers.find({where: {symbol:symbol}}, function(err, data) {
        if (err) {
            throw err;
        } else {
            return cb(null, data);
        }
    })
  };
  Tickers.remoteMethod(
      'getExchangesBySymbol', {
          accepts: [
              {arg: 'symbol', type: 'string'}
          ],
          description: [
              'get all of exchanges by symbol. example:"BTC/USD"'
          ],
          http: {path: '/getexchange', verb:'get'},
          returns: {arg: 'res', type:'array'}
      }
  )

  // getSymbolByExchange
  Tickers.getSymbolByExchange = function(exchange, cb) {
    Tickers.find({where: {exchange: exchange}}, function(err, data) {
        if (err) {
            throw err;
        } else {
            return cb(null, data);
        }
    })
  }
  Tickers.remoteMethod(
      'getSymbolByExchange', {
          accepts: [
              {arg: 'exchange', type: 'string'}
          ],
          description: [
              'get all of symbols by exchage'
          ],
          http: {path: '/getSymbol', verb: 'get'},
          returns: {arg: 'res', type: 'array'}
      }
  )

  // getTickerByCurrency
  Tickers.getExchangesByCurrency = function(currency, cb) {
    Tickers.find({where: {symbol:{like: currency}}}, function(err, data) {
        if (err) {
            throw err;
        } else {
            return cb(null, data);
        }
    })
  };
  Tickers.remoteMethod(
      'getExchangesByCurrency', {
          accepts: [
              {arg: 'currency', type: 'string'}
          ],
          description: [
              'get all of exchanges by currency. example:"BTC"'
          ],
          http: {path: '/gettickerwithcurrency', verb:'get'},
          returns: {arg: 'res', type:'array'}
      }
  )
};
