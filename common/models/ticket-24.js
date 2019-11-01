// import { resolve } from 'path';
// import { reject } from './C:/Users/highdev/AppData/Local/Microsoft/TypeScript/2.6/node_modules/@types/async';

// import { read } from 'fs';
// import { resolve } from 'dns';
// import { reject } from './C:/Users/highdev/AppData/Local/Microsoft/TypeScript/2.6/node_modules/@types/async';

'use strict';
const request = require('request');
const app = require('../../server/server')

module.exports = function(Ticket24) {

  Ticket24.asyncResetAllData = async function() {
    const trades = await Ticket24.get24HData();
    const len = await Ticket24.resetData(trades);
    return len;
  }

  Ticket24.get24HData = async function() {
    return new Promise((resolve, reject) => {
      const query = {
        // order: 'symbol ASC',
        where: {
          timestamp: {
            gt: Date.now() - 1000 * 60 * 60 * 24
          }
        }
      };
      app.models.DataPoint15M.find(query, function(err, trades) {
        if (err) {
          console.log(err);
          return reject(err);
        } else {
          return resolve(trades);
        }
      })
    })
  }

  Ticket24.resetData = async function(trades) {
    let count = 0;
    let datas = {};
    let symbol;
    for (let i = 0; i < trades.length; i++) {
      const trade = trades[i];
      if (symbol == trade.symbol) {
        datas[symbol].push(trade);
      } else {
        symbol = trade.symbol;
        datas[symbol] = [];
        datas[symbol].push(trade);
      }
    }
    // let results = [];
    for (let symbol in datas) {
      let exdata = {};
      datas[symbol].map(trade => {
        const exchanges = JSON.parse(trade.exchanges);
        for (let exchange in exchanges) {
          if (exdata[exchange]) {
            exdata[exchange].volume += exchanges[exchange].volume;
            exdata[exchange].amount += exchanges[exchange].amount;
          } else {
            exdata[exchange] = {
              volume : exchanges[exchange].volume,
              amount : exchanges[exchange].amount,
            };
          }
        }
      })
      // if (symbol == 'LTC/USD') {
      //   console.log(symbol);
      // }
      for (let exchange in exdata) {
        if (exdata[exchange].amount > 0) {
          let price = exdata[exchange].volume / exdata[exchange].amount;
          const result = {
            symbol: symbol,
            exchange: exchange,
            volume: exdata[exchange].volume,
            price: price,
            updateAt: Date.now(),
            change: 0
          };
          console.log(result.exchange, '-', result.symbol);
          await Ticket24.updateDBTicker24(result);
          count++;
        }
      }
    }
    console.log('count=', count);
    return count;
  }

  Ticket24.updateDBTicker24 = async function(ticker) {
    return new Promise((resolve, reject) => {
      const query = {
        where: {
          exchange: ticker.exchange,
          symbol: ticker.symbol
        }
      }
      Ticket24.find(query, function(err, oldTicker) {
        if (err) {
          console.log(err);
          return reject(err);
        } else {
          if (oldTicker.length > 0) {
            ticker.change = (ticker.price - oldTicker[0].price) / oldTicker[0].price;
          }
          Ticket24.upsertWithWhere( { exchange: ticker.exchange, symbol: ticker.symbol }, ticker, (err, model) => {
            if (err) {
              console.log(err);
              return reject(err);
            } else {
              return resolve();
            }
          });
        }
      })
    });
  }

  // 24h Price and Volume
  Ticket24.updateCoin24Info = async function(quote_param) {
    const btc_usd = await getLastVWAPBySymbol('BTC', 'USD');
    const priceBTC_list = await app.models.CoinPrice.getAllBTCPrice();
    const fiatUSD_list = await app.models.FiatCurrency.asyncGetAllCurrency();
    function getCurrenyRate(cur) {
      if (cur == 'USD') {
        return 1;
      }
      let rate = fiatUSD_list[cur.toLowerCase()];
      if (!rate) {
        let btc;
        if (cur == 'BTC') {
          btc = 1;
        } else {
          if (priceBTC_list[cur]) {
            btc = priceBTC_list[cur].btc;
          }
        }
        if (btc) {
          rate = btc * btc_usd;
        }
      }
      if (rate) {
        return rate;
      }
      return 0;
    }

    const coins = await app.models.CoinData.asyncGetCoinData();
    let coin_prices = {};
    for (let i = 0; i < coins.length; i++) {
      let coin = coins[i];
      const currency = coin.base_name;
      const tickers = await Ticket24.getTickerInfo(currency, 'USD');

      let amount = 0, volume = 0;
      tickers.map(ticker => {
        if (ticker.symbol == 'LTC/BTC') {
          // console.log('test');
        }
        let price, rate;
        const str = ticker.symbol.split('/');
        const base = str[0], quote = str.length > 1 ? str[1] : undefined;
        const vwap = ticker.price;
        if (currency === base) {
          rate = getCurrenyRate(quote);
          price = vwap * rate;
        } else {
          rate = getCurrenyRate(base);
          price = (1 / vwap) * rate;
        }
        if (currency == 'BTC') {
          if (price < 1) price = 0;
        }
        ticker.price = price;
        ticker.volume = ticker.volume * rate;

        if (ticker.price) {
          amount += (ticker.volume / ticker.price);
          volume += (ticker.volume);
        }
      })
      const vwap = volume / amount;

      // coin.change = (coin.price_usd - vwap) / vwap;
      // const before_price = await CoinInfo.getInfoBefore24(coin.coin_id, Date.now());
      // coin.change = (before_price - vwap) / vwap;
      coin.change = priceBTC_list[coin.coin_id] ? priceBTC_list[coin.coin_id].percent_change_24h : 0;
      coin_prices[coin.coin_id] = vwap;
      coin.price_usd = vwap;
      coin['24h_volume_usd'] = volume;
      await app.models.CoinData.updateCoinDataDB(coin);
    }
    await app.models.CoinInfo.updateDBCoinInfo(coin_prices);
  }

  Ticket24.getTickerInfo = async function(currency, quote_param) {
    return new Promise((resolve, reject) => {
      const exp1 = new RegExp('^' + currency + '\/.*$');
      const exp2 = new RegExp('^.*\/' + currency + '$');
      const query = {
        order: 'symbol ASC',
        where: {
          'or': [
            {
              'symbol': exp1
            },
            {
              'symbol': exp2
            },
          ],
        }
      }
      Ticket24.find(query, function(err, tickers) {
        if (err) {
          return reject(err);
        } else {
          return resolve(tickers);
        }
      })
    })
  }

  Ticket24.updatePriceList = function() {
    (async() => {
      const btc = await app.models.CoinPrice.asyncGetCurreny('BTC');
      Ticket24.btc_usd = Number(btc.usd);
      Ticket24.priceBTC_list = await app.models.CoinPrice.getAllBTCPrice();
      Ticket24.fiatUSD_list = await app.models.FiatCurrency.asyncGetAllCurrency();
      console.log('updatePriceList');
    })()
  }

  // 24h Price and Volume
  Ticket24.get24hInfo = function(currency, quote_param, limit, cb) {
    const exp1 = new RegExp('^' + currency + '\/.*$');
    const exp2 = new RegExp('^.*\/' + currency + '$');
    const query = {
      order: 'symbol ASC',
      where: {
        'or': [
          {
            'symbol': exp1
          },
          {
            'symbol': exp2
          },
        ],
        volume: {
          gt: 0.01
        }
      },
      limit: limit
    }


    Ticket24.find(query, function(err, tickers) {
      (async() => {
        if (err) {
          console.log(err);
          cb(null, null);
        } else {
          // const btc_usd = await getLastVWAPBySymbol('BTC', 'USD');
          // const btc = await app.models.CoinPrice.asyncGetCurreny('BTC');
          // const btc_usd = Number(btc.usd);
          const usd_fit = await getConvertFiatCurrency('usd', quote_param);
          // const priceBTC_list = await app.models.CoinPrice.getAllBTCPrice();
          // const fiatUSD_list = await app.models.FiatCurrency.asyncGetAllCurrency();
          // Ticket24.updatePriceList();

          let results = [];
          tickers.map(ticker => {
            if (ticker.symbol == 'LEO/BTC') {
              console.log('test');
            }
            let price, rate;
            const str = ticker.symbol.split('/');
            const base = str[0], quote = str.length > 1 ? str[1] : undefined;
            const vwap = ticker.price;
            if (currency === base) {
              rate = Ticket24.convertCurrenyRate(quote, usd_fit);
              price = vwap * rate;
            } else {
              // if (currency == 'BTC') {
              //   rate = getFiatCurrenyRate(base, quote_param);
              //   if (!rate) {
              //     rate = btc_usd;
              //     price = vwap * btc_usd;
              //   } else {
              //     price = vwap * btc_usd * rate;
              //   }
              // } else {
                rate = Ticket24.convertCurrenyRate(base, usd_fit);
                price = (1 / vwap) * rate;
              // }
            }
            if (currency == 'BTC') {
              if (price < 1) price = 0;
            }
            ticker.price = price;
            ticker.volume = ticker.volume * rate;
            results.push(ticker);
          })
          cb(null, results);
        }
      })()
    })
  }

  Ticket24.remoteMethod(
    'get24hInfo', {
      accepts: [
        { arg: 'currency', type: 'string'},
        { arg: 'quote_param', type: 'string'},
        { arg: 'limit', type: 'number'},
      ],
      description: [
        'get last 24 infos',
        'example: base = "BTC"'
      ],
      http: { path: '/get24info', verb: 'get', errorStatus: 400},
      returns: { arg: 'res', type: 'object' }
    }
  )

  function getChange(newV, oldV, symbol) {
    if (newV && oldV) {
      if (newV[symbol] && oldV[symbol]) {
        return {
          price: (newV[symbol].price - oldV[symbol].price) / newV[symbol].price,
          volume: (newV[symbol].volume - oldV[symbol].volume) / newV[symbol].volume,
        }
      }
    }
    return 0;
  }
  Ticket24.getPriceChanges = async function(param_exchange) {
    const trades0 = await app.models.DataPoint15M.getDataWithExchange(param_exchange, 1);
    const trades1 = await app.models.DataPoint15M.getDataWithExchange(param_exchange, 2);
    const trades2 = await app.models.DataPoint15M.getDataWithExchange(param_exchange, 3);
    const trades3 = await app.models.DataPoint15M.getDataWithExchange(param_exchange, 5);
    const trades4 = await app.models.DataPoint15M.getDataWithExchange(param_exchange, 24 * 4);
    let trades = [trades0, trades1, trades2, trades3, trades4];
    if (trades0) {
      let results = {};
      for (let symbol in trades0) {
        results[symbol] = {};
        results[symbol][0] = getChange(trades[0], trades[1], symbol);
        results[symbol][1] = getChange(trades[0], trades[2], symbol);
        results[symbol][2] = getChange(trades[0], trades[3], symbol);
        results[symbol][3] = getChange(trades[0], trades[4], symbol);
        results[symbol]['last_price'] = trades[0][symbol].price;
      }
      return results;
    }
  }

  Ticket24.getExchange24 = function(exchange, quote_param, cb) {
    (async() => {
      const coinDatas = await app.models.CoinData.asyncGetCoinData();
      let coin_results = {};
      coinDatas.map(coin => {
        if (coin.base_name) {
          coin_results[coin.base_name] = {
            name: coin.name
          }
        }
      })

      const prices_change = await Ticket24.getPriceChanges(exchange);

      const btc_usd = await getLastVWAPBySymbol('BTC', 'USD');
      const priceBTC_list = await app.models.CoinPrice.getAllBTCPrice();
      const fiatUSD_list = await app.models.FiatCurrency.asyncGetAllCurrency();


      function getCurrenyRate(cur) {
        if (cur == 'USD') {
          return 1;
        }
        let rate = fiatUSD_list[cur.toLowerCase()];
        if (!rate) {
          let btc;
          if (cur == 'BTC') {
            btc = 1;
          } else {
            if (priceBTC_list[cur]) {
              btc = priceBTC_list[cur].btc;
            }
          }
          if (btc) {
            rate = btc * btc_usd;
          }
        }
        if (rate) {
          return rate;
        }
        return 0;
      }

      const tickers = await getExchageFromDB(exchange);
      let coin_data = [];
      let sum_volume = 0;
      for (let i = 0; i < tickers.length; i++) {
        const ticker = tickers[i];
        const str = ticker.symbol.split('/');
        const base = str[0], quote = str.length > 1 ? str[1] : undefined;
        if (quote) {
          const usd_rate = getCurrenyRate(quote);
          const usd_volume = ticker.volume * usd_rate;
          sum_volume += usd_volume;

          let lastPrice = ticker.price * usd_rate;
          if (prices_change[ticker.symbol] && prices_change[ticker.symbol]['last_price']) {
            lastPrice = prices_change[ticker.symbol]['last_price'] * usd_rate;
          }
          coin_data.push({
            name: coin_results[base] ? coin_results[base].name : '',
            code: base,
            quote: quote,
            last: lastPrice,
            volume: usd_volume,
            change: prices_change[ticker.symbol]
          });
        }
      }
      cb(null, {
        volume: sum_volume,
        symbol_data: coin_data
      });
    })()
  }

  Ticket24.remoteMethod(
    'getExchange24', {
      accepts: [
        { arg: 'exchange', type: 'string'},
        { arg: 'quote_param', type: 'string'},
      ],
      description: [
        'get last 24 infos for Exchange',
        'example: exchange = "bitfinex", quote_param = "USD"'
      ],
      http: { path: '/getexchange24', verb: 'get', errorStatus: 400},
      returns: { arg: 'res', type: 'object' }
    }
  )





  Ticket24.resetExchange24 = async function(exchanges) {
    const btc_usd = await getLastVWAPBySymbol('BTC', 'USD');
    const priceBTC_list = await app.models.CoinPrice.getAllBTCPrice();
    const fiatUSD_list = await app.models.FiatCurrency.asyncGetAllCurrency();

    function getCurrenyRate(cur) {
      if (cur == 'USD') {
        return 1;
      }
      let rate = fiatUSD_list[cur.toLowerCase()];
      if (!rate) {
        let btc;
        if (cur == 'BTC') {
          btc = 1;
        } else {
          if (priceBTC_list[cur]) {
            btc = priceBTC_list[cur].btc;
          }
        }
        if (btc) {
          rate = btc * btc_usd;
        }
      }
      if (rate) {
        return rate;
      }
      return 0;
    }

    let exchange_volumes = {};
    await Promise.all(exchanges.map(async exchange => {
      const tickers = await getExchageFromDB(exchange);
      let sum_volume = 0;
      for (let i = 0; i < tickers.length; i++) {
        const ticker = tickers[i];
        const str = ticker.symbol.split('/');
        const base = str[0], quote = str.length > 1 ? str[1] : undefined;
        if (quote) {
          const usd_rate = getCurrenyRate(quote);
          const usd_volume = ticker.volume * usd_rate;
          sum_volume += usd_volume;
        }
      }
      exchange_volumes[exchange] = sum_volume;
      await app.models.Exchanges.updateVolume(exchange, sum_volume);
    }))

    return exchange_volumes;
  }

  let getExchageFromDB = async function(exchange) {
    return new Promise((resolve, reject) => {
      const query = {
        order: 'symbol ASC',
        where: {
          exchange: exchange
        }
      }
      Ticket24.find(query, function(err, tickers) {
        if (err) {
          return reject(err);
        } else {
          let skipSymbols = {
            bxinth: ['CPT/BTC', 'LEO/BTC', 'ZET/BTC'],
          }
          if (skipSymbols[exchange]) {
            removeTickets(tickers, skipSymbols[exchange]);
          }
          return resolve(tickers);
        }
      });
    })
  }

  Ticket24.convertCurrenyRate = function(cur, usd_fit) {
    if (cur == 'USD') {
      return 1;
    }
    let rate = Ticket24.fiatUSD_list[cur.toLowerCase()];
    if (!rate) {
      let btc;
      if (cur == 'BTC') {
        btc = 1;
      } else {
        if (Ticket24.priceBTC_list[cur]) {
          btc = Ticket24.priceBTC_list[cur].btc;
        }
      }
      if (btc) {
        btc = btc * Ticket24.btc_usd;
        rate = btc * usd_fit;
      }
    }
    if (rate) {
      return rate;
    }
    return 0;
  }
  // function getFiatCurrenyRate(cur, fiat) {
  //   if (cur == 'USD') {
  //     return 1;
  //   }
  //   let rate = fiatUSD_list[cur.toLowerCase()];
  //   if (rate) {
  //     return rate;
  //   }
  //   return 0;
  // }

};

let removeTickets = function(tickers, skips) {
  let indices = [];
  for (let i = 0; i < skips.length; i++) {
    var skip = skips[i];
    for (let k = 0; k < tickers.length; k++) {
      if (tickers[k].symbol == skip) {
        indices.push(k);
        break;
      }
    }
  }
  // indices.sort();
  for (let i = indices.length - 1; i >= 0; i--) {
    tickers.splice(indices[i], 1);
  }
}

const fiatCurrencies = [
  'aed', 'afn', 'all', 'amd', 'ang', 'aoa', 'ars', 'aud', 'awg', 'azn', 'bam', 'bbd', 'bdt', 'bgn', 'bhd', 'bif', 'bmd', 'bnd', 'bob', 'brl', 'bsd', 'btn', 'bwp',
  'byn', 'bzd', 'cad', 'cdf', 'chf', 'clp', 'cny', 'cop', 'crc', 'cuc', 'cup', 'cve', 'czk', 'djf', 'dkk', 'dop', 'dzd', 'egp', 'ern', 'etb', 'eur', 'fjd', 'fkp',
  'gbp', 'gel', 'ghs', 'gip', 'gmd', 'gnf', 'gtq', 'gyd', 'hkd', 'hnl', 'hrk', 'htg', 'huf', 'idr', 'ils', 'inr', 'iqd', 'irr', 'isk', 'jmd', 'jod', 'jpy', 'kes',
  'kgs', 'khr', 'kmf', 'kpw', 'krw', 'kwd', 'kyd', 'kzt', 'lak', 'lbp', 'lkr', 'lrd', 'lsl', 'lyd', 'mad', 'mdl', 'mga', 'mkd', 'mmk', 'mnt', 'mop', 'mro', 'mru',
  'mur', 'mvr', 'mwk', 'mxn', 'myr', 'mzn', 'nad', 'ngn', 'nio', 'nok', 'npr', 'nzd', 'omr', 'pab', 'pen', 'pgk', 'php', 'pkr', 'pln', 'pyg', 'qar', 'ron', 'rsd',
  'rub', 'rwf', 'sar', 'sbd', 'scr', 'sdg', 'sek', 'sgd', 'shp', 'sll', 'sos', 'srd', 'std', 'stn', 'svc', 'syp', 'szl', 'thb', 'tjs', 'tmt', 'tnd', 'top', 'try',
  'ttd', 'twd', 'tzs', 'uah', 'ugx', 'usd', 'uyu', 'uzs', 'vef', 'vnd', 'vuv', 'wst', 'xaf', 'xag', 'xau', 'xbt', 'xcd', 'xdr', 'xof', 'xpd', 'xpf', 'xpt', 'yer',
  'zar', 'zmw'
];
async function getConvertFiatCurrency(src, dst) {
  dst = dst.toLowerCase();
  if (fiatCurrencies.indexOf(dst) < 0) {
    return 0;
  }
  if (src == dst) {
    return 1.0;
  }
  return new Promise((resolve, reject) => {
    const forexUrl = 'https://dev.kwayisi.org/apis/forex/' + src + '/' + dst;
    request(forexUrl, { json: true }, (err, res, body) => {
      if (err) {
        return reject(err);
      }
      if (body.error) {
        return resolve(0);
      }
      return resolve(body.rate);
    });
  });
}

let getLastVWAPBySymbol = async function(base, quote) {
  if (base == quote) {
    return 1;
  }
  return new Promise((resolve, reject) => {
    const symbol = base + '/' + quote;
    app.models.TradesInfo.getLastVWAP(symbol, function(err, result) {
      if (err) {
        return reject(err);
      } else {
        return resolve(result.price);
      }
    })
  })
}

