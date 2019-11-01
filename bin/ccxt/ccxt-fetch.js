// import { retry } from './C:/Users/highdev/AppData/Local/Microsoft/TypeScript/2.6/node_modules/@types/async';

// var memwatch = require('memwatch-next');
// memwatch.on('leak', function(info) { /*Log memory leak info, runs when memory leak is detected */ });
// memwatch.on('stats', function(stats) { /*Log memory stats, runs when V8 does Garbage Collection*/ });

//It can also do this...
// var hd = new memwatch.HeapDiff();
// // Do something that might leak memory
// var diff = hd.end();
// console.log(diff);

let g_exchanges = [];
let g_symbols = [];
let g_count = 0;
let g_symbolCnt = 0;
const ccxt = require('ccxt');
const async = require('async');

const fs = require ('fs')
const verbose = false
const debug = false
const enableRateLimit = true
const keysGlobal = './keys.json'
const keysLocal = 'keys.local.json'
let keysFile = fs.existsSync (keysLocal) ? keysLocal : keysGlobal


let g_lastTrades = {};
class ccxtApi {
  constructor(dataMain) {
    this.dataMain = dataMain;
  }

  startFetching() {
    var configs = {};

    const objects = ['paymium', 'bit2c', 'bitfinex'];
    // async.forEachOf(ccxt.exchanges, (value, key, callback) => {
    async.forEachOf(objects, (value, key, callback) => {
      this.fetchExchange(value);
        // fs.readFile(__dirname + value, "utf8", (err, data) => {
        //     if (err) return callback(err);
        //     try {
        //         configs[key] = JSON.parse(data);
        //     } catch (e) {
        //         return callback(e);
        //     }
        //     callback();
        // });
    }, err => {
        if (err) console.error(err.message);
        // configs is now a map of JSON data
    });
  }

  fetchExchange(id) {
    (async() => {
      let settings = require (keysFile)[id] || {}
      if (!settings.disable) {
        let exchange = new (ccxt)[id] ({
          verbose,
          enableRateLimit,
          debug,
          timeout: 20000,
        })
        Object.assign (exchange, settings);
        const markets = await exchange.loadMarkets();
        const required_credentials = exchange.requiredCredentials;
        if (exchange.markets && exchange.hasFetchTrades) {
          g_lastTrades[exchange.id] = {};
          while(true) {
            await startFetchAllTicker(exchange, this.dataMain);
            sleep(1000);
            g_count++;
          }
        }
      }
    })()
  }
}

async function initCheckExchanges(count) {
    // id = 'livecoin';
    await Promise.all (ccxt.exchanges.map (async id => {
      try {
        let settings = require (keysFile)[id] || {}
        if (!settings.disable) {
          let exchange = new (ccxt)[id] ({
            verbose,
            enableRateLimit,
            debug,
            timeout: 20000,
          })
          Object.assign (exchange, settings);
          // console.log(settings);

          await exchange.loadMarkets()
          if (exchange.markets && (exchange.hasFetchTickers || exchange.hasFetchTrades)) {
            g_exchanges.push(exchange);
            // if(exchange.symbols.length > 6000)
              console.log(g_count, '--', exchange.id, exchange.symbols.length);
            for (let i = 0; i < exchange.symbols.length; i++) {
              // if (isAvailableCurrency(exchange.symbols[i]));
                g_symbols.push(exchange.symbols[i]);
            }
            // console.log(exchange.symbols.length);
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
            throw e;
        }
      }
    }));
}

async function startFetchAllTicker(exchange, dataMan) {
  try {
    console.log('*****startFetch******', exchange.id);
    // if (id == 'bittrex') {
          // if (exchange.hasFetchTickers) {
          //   console.log('########ticker', exchange.id);
          //   await fetchTickers(exchange, dataMan);
          // }
    await fetchAllTrades(exchange, dataMan);
    console.log('###################finishExchange', exchange.id);
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
  // }
  // }))
  console.log('###################finiseh', g_count);
}

async function fetchTickers(exchange, dataMan) {
  try {
  await sleep (exchange.rateLimit);
  let tickers = await exchange.fetchTickers();
  const keys = Object.keys(tickers);
  if (keys) {
    // await Promise.all(keys.map(async key => {
      // console.log(key);
    for (let i = 0; i < keys.length; i++) {
      let ticker = tickers[keys[i]];
      if (ticker.symbol) {
        // await updateDBTicker(exchange.id, ticker, dataMan);
        await dataMan.updateDBTicker({
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
      }
      // console.log('---end', id, ticker.symbol);
      ticker = null;
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
      throw e;
  }
}
}

function compareLastTrades(newTrades, lastTrades) {
  if (!lastTrades || !newTrades) return newTrades;
  if (lastTrades.length == 0) return newTrades;
  if (newTrades.length == 0) return undefined;
  for (let i = newTrades.length - 1; i >= 0; i--) {
    if (newTrades[i].timestamp >= lastTrades[0].timestamp) {
      return newTrades.slice(0, i);
    }
  }
  return newTrades;
}

let g_currencies = [
  'USD', 'AUD', 'BRL', 'CAD', 'CHF', 'CLP', 'CNY', 'CZK',
  'DDK', 'EUR', 'GBP', 'HKD', 'HUF', 'IDR', 'ILS', 'INR',
  'JPY', 'KRW', 'MXN', 'MYR', 'NOK', 'NZD', 'PHP', 'PKR',
  'PLN', 'RUB', 'SEK', 'SGD', 'THB', 'TRY', 'TWD', 'ZAR'
];
function isAvailableCurrency(symbol) {
  const pars = symbol.split('/');
  if (pars.length == 2) {
    for (let currency of g_currencies) {
      if (pars[1] === currency)
        return true;
    }
  }
  return false;
}

async function fetchAllTrades(exchange, dataMan) {
  // await Promise.all (exchange.symbols.map (async symbol => {
  // await sleep (exchange.rateLimit);
  let timestamp = Date.now();
  for (let i = 0; i < exchange.symbols.length; i++) {
    const symbol = exchange.symbols[i];
    // if (symbol == 'GAM/BTC')
    //   continue;
    // try {
      timestamp = Date.now() - timestamp;
      if (exchange.rateLimit > timestamp)
        await sleep(exchange.rateLimit - timestamp);

      // if (!isAvailableCurrency(symbol)) continue;
      // const order = await exchange.fetchOrderBook(symbol);
      // const inTime = Date.now();// - 1000 * 60 * 60 * 1 * 1 * 1;
      let trades = await exchange.fetchTrades(symbol, g_lastTrades[exchange.id][symbol], 2000);
      // const newTrades = compareLastTrades(trades, g_lastTrades[exchange.id]);
      if (trades && trades.length > 0) {
        g_lastTrades[exchange.id][symbol] = trades[0].timestamp;

        if (trades && trades.length > 0) {
          let data = [];
          await trades.map(trade => {
            if (trade) {
              data.push({
                    type: trade['type'],
                    trade_id: trade['id'],
                    amount: trade['amount'],
                    price: trade['price'],
                    updateAt: trade['updateAt'],
                    timestamp: trade['timestamp'],
                    side: trade['side'],
                  })
            }
          })
          if (data.length > 0) {
            trade_obj = {
              exchange: exchange.id,
              symbol: symbol,
              timestamp: Date.now(),
              data: JSON.stringify(data),
            }
            await dataMan.updateDBTrades(trade_obj);
            g_symbolCnt++;
            console.log('********', g_count, g_symbolCnt, trades.length, exchange.id, symbol, new Date().getTime(), '------', data.length);
          }
          data = [];
        }
      }
    // } catch(e) {
    //   if (e instanceof ccxt.DDoSProtection) {
    //     console.log(e.message, '[DDoS Protection]')
    //   } else if (e instanceof ccxt.RequestTimeout) {
    //     console.log(e.message, '[Request Timeout]')
    //   } else if (e instanceof ccxt.AuthenticationError) {
    //     console.log(e.message, '[Authentication Error]')
    //   } else if (e instanceof ccxt.ExchangeNotAvailable) {
    //     console.log(e.message, '[Exchange Not Available]')
    //   } else if (e instanceof ccxt.ExchangeError) {
    //     console.log(e.message, '[Exchange Error]')
    //   } else if (e instanceof ccxt.NetworkError) {
    //     console.log(e.message, '[Network Error]')
    //   } else {
    //     console.log(e);
    //       // throw e;
    //   }
    // }
  }
}


let human_value = function (price) {
  return typeof price == 'undefined' ? 'N/A' : price
}

let sleep = (ms) => new Promise (resolve => setTimeout (resolve, ms))





async function getVWAPWithSymbol(symbol, limit) {
  try {
    let sum = 0, amount = 0;
    // for (let i = 0; i < ccxt.exchanges.length; i++) {
    await Promise.all(ccxt.exchanges.map(async id => {
      // const id = ccxt.exchanges[i];
      console.log('*****startFetch******', id);
      let settings = require (keysFile)[id] || {}
      if (!settings.disable) {
        let exchange = new (ccxt)[id] ({
          verbose,
          enableRateLimit,
          debug,
          timeout: 3000,
        })
        Object.assign (exchange, settings);
        await exchange.loadMarkets();
        if (exchange.markets && exchange.symbols.indexOf(symbol) >= 0) {
          if (exchange.hasFetchTrades) {
            console.log('########trades', exchange.id);
            // await sleep (exchange.rateLimit);
            let trades = await exchange.fetchTrades(symbol, undefined, limit);
            if (trades && trades.length > 0) {
              trades.map(trade => {
                if (trade['amount'] > 0) {
                  sum += trade.price * trade.amount;
                  amount += trade.amount;
                }
              })
            }
          }
        }
      }
    }))
    if (amount > 0) {
      return (sum / amount);
    }
    console.log('-----FetchAllTicker');

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
        throw e;
    }
  }
}

module.exports = {
  main: function(dataMain) {
    const api = new ccxtApi(dataMain);
    api.startFetching();
  },

  getVWAPWithSymbol: getVWAPWithSymbol
}
