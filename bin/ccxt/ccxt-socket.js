'use strict';

module.exports = {
  start: function(app) {
    console.log('starting socket');

    const async = require('async');
    const ccxt = require('ccxt');
    var server = require('http').createServer(app);
    var io = require('socket.io')(server);
    // app.set('socketio', socketio);

    // io.sockets.on('connection', function (socket) {
    //   console.log('A client is connected!');
    // });

    io.on('connection', function(client) {
      console.log('Client connected...');
      let g_symbol = '';

      client.on('disconnect', function(){
        console.log( client.name + ' has disconnected from the chat.' + client.id);
      });

      client.on('join', function(data) {
        console.log(data);
      });

      client.on('arbitrage', function(symbol) {
        g_symbol = symbol;
        if (symbol == 'stop') {
          return;
        }
        console.log('start', symbol);
        const exchanges = ccxt.exchanges;
        async.forEachOf(exchanges, id => {
          (async() => {
            let prevPrice;
            let exchange = new (ccxt)[id];
            await exchange.loadMarkets();
            if (exchange.markets && exchange.hasFetchTrades) {
              while(client.connected && g_symbol == symbol) {
                if (exchange.symbols.indexOf(symbol) >= 0) {
                  try {
                    console.log(symbol, Date.now());
                    let nCount = 1;
                    if (!prevPrice) {
                      nCount = 2;
                    }
                    let trades = await exchange.fetchTrades(symbol, undefined, nCount);
                    await sleep(exchange.rateLimit + 1000);
                    if (trades.length > 0) {
                      const trade = trades[0];
                      let result = {
                        symbol: symbol,
                        exchange: exchange.id,
                        exchange_vol: 0,
                        price: trade.price,
                        change: 0
                      };
                      if (prevPrice) {
                        result.change = (prevPrice - trade.price) / trade.price;
                      } else {
                        if (trades.length == 2) {
                          result.change = (trades[1].price - trade.price) / trade.price;
                        }
                      }
                      prevPrice = trade.price;
                      if (result.change != 0) {
                        client.emit('arbitrage_result', result);
                      }
                    }
                  } catch(e) {
                    // console.log(e);
                    break;
                  }
                } else {
                  break;
                }
              }
            }
          })()
        })
      });

      client.on('detailpage', function(symbol) {
        const base = symbol.split('/')[0];
        g_symbol = symbol;
        if (symbol == 'stop') {
          return;
        }
        console.log('start', symbol);
        const exchanges = ccxt.exchanges;
        let timestamp = 0;
        let timestamp2 = 0;
        async.forEachOf(exchanges, id => {
          (async() => {
            let prevPrice;
            let exchange = new (ccxt)[id];
            await exchange.loadMarkets();
            if (exchange.markets && exchange.hasFetchTrades) {
              while(client.connected && g_symbol == symbol) {
                if (exchange.symbols.indexOf(symbol) >= 0) {
                  try {
                    console.log(symbol, Date.now());
                    let nCount = 1;
                    if (!prevPrice) {
                      nCount = 2;
                    }
                    let trades = await exchange.fetchTrades(symbol, undefined, nCount);
                    await sleep(exchange.rateLimit + 1000);
                    if (trades.length > 0) {
                      const trade = trades[0];
                      let result = {
                        symbol: symbol,
                        exchange: exchange.id,
                        exchange_vol: 0,
                        price: trade.price,
                      };
                      // if (prevPrice) {
                      //   result.change = (prevPrice - trade.price) / trade.price;
                      // } else {
                      //   if (trades.length == 2) {
                      //     result.change = (trades[1].price - trade.price) / trade.price;
                      //   }
                      // }
                      if (prevPrice != trade.price) {
                        if (Date.now() - timestamp > 1200) {
                          if (Date.now() - timestamp2 > 5000) {
                            client.emit('detailpage_result', result);
                            const price_res = await app.models.CoinPrice.asyncGetCurreny(base);
                            if (price_res) {
                              if (price_res.usd && price_res.percent_change_24h) {
                                const oldPrice = price_res.usd * price_res.percent_change_24h / 100 + (price_res.usd - 0);
                                result.change = (oldPrice - trade.price) / trade.price;
                              }
                            }
                            timestamp2 = Date.now();
                          }
                          client.emit('detailpage_result', result);
                          timestamp = Date.now();
                        }
                        prevPrice = trade.price;
                      }
                    }
                  } catch(e) {
                    // console.log(e);
                    break;
                  }
                } else {
                  break;
                }
              }
            }
          })()
        })
      });
    })

    server.listen(5001);

      // async function getCCXTExchanges() {
      //   let sExchanges = {
      //     'BTC/USD': ['gdax', 'kraken', 'bitfinex', 'bitstamp', 'bitflyer', 'gemini', 'cex', 'itbit', 'lakebtc', 'exmo', 'wex',
      //                 'livecoin', 'dsx', 'quadrigacx', 'independentreserve', 'mixcoins', 'coinfloor', 'gatecoin', 'okcoinusd', 'southxchange', 'bitlish', 'coingi']
      //   }
      //   let results = [];
      //   const ccxt = require('ccxt');
      //   // for (let i = 0; i < ccxt.exchanges.length; i++) {
      //   for (let i = 0; i < sExchanges['BTC/USD'].length; i++) {
      //     try {
      //       // const id = ccxt.exchanges[i];
      //       const id = sExchanges['BTC/USD'][i];
      //       let exchange = new (ccxt)[id]();
      //       await exchange.loadMarkets();
      //       if (exchange.markets && exchange.hasFetchTrades) {
      //         results[id] = exchange;
      //       }
      //     } catch (e) {
      //       if (e instanceof ccxt.DDoSProtection) {
      //         console.log(e.message, '[DDoS Protection]')
      //       } else if (e instanceof ccxt.RequestTimeout) {
      //         console.log(e.message, '[Request Timeout]')
      //       } else if (e instanceof ccxt.AuthenticationError) {
      //         console.log(e.message, '[Authentication Error]')
      //       } else if (e instanceof ccxt.ExchangeNotAvailable) {
      //         console.log(e.message, '[Exchange Not Available]')
      //       } else if (e instanceof ccxt.ExchangeError) {
      //         console.log(e.message, '[Exchange Error]')
      //       } else if (e instanceof ccxt.NetworkError) {
      //         console.log(e.message, '[Network Error]')
      //       } else {
      //         console.log(e);
      //       }
      //     }
      //   }
      //   return results;
      // }

      let sleep = (ms) => new Promise (resolve => setTimeout (resolve, ms))

  }
}


