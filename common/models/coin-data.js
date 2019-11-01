'use strict';

const app = require('../../server/server')
const ccxt = require('ccxt');
const base64Img = require('base64-img');

module.exports = function(CoinData) {
  CoinData.getAllData = function(start, limit, cb) {
    const query = {
      // where: {
      //   and: [
      //     {
      //       '24h_volume_usd': {
      //         gt: 0.01
      //       },
      //     },
      //     {
      //       'market_cap_usd': {
      //         gt: 0.01
      //       }
      //     }
      //   ]
      // },
      order: 'market_cap_usd DESC',
      skip: start,
      limit: limit
    }
    CoinData.find(query, function(err, data) {
      if (err) {
        return err;
      } else {
        return cb(null, {
          totalMarket: CoinData.totalMarket,
          data: data
        });
      }
    })
  }

  CoinData.remoteMethod(
    'getAllData', {
      accepts: [
        { arg: 'start', type: 'number' },
        { arg: 'limit', type: 'number' },
      ],
      description: [
        'get all CoinData'
      ],
      http: { path: '/getalldata', verb: 'get'},
      returns: { arg: 'res', type: 'string' }
    }
  );

  CoinData.updateTotalMarket = async function() {
    return new Promise((resolve, reject) => {
      CoinData.getAllData(0, undefined, function(err, coins) {
        if (err) {
          return resolve(err);
        }
        let sum = 0;
        coins.data.map(coin => {
          sum += (coin.market_cap_usd - 0);
        })
        CoinData.totalMarket = sum;
        return resolve(sum);
      })
    })
  }
  // CoinData.getSymbolDetail = function(symbol, startNum, limit, cb) {
  //   let result = [];
  //   app.models.Tickers.find({where: {symbol: symbol}, skip:startNum, limit:limit}, function(err, data) {
  //     if (err) {
  //       console.log(err);
  //       throw err;
  //     } else {
  //       for ( var i = 0 ; i < data.length ; i ++ ) {
  //         var rlt = new Object();
  //         rlt.source = data[i].exchange;
  //         rlt.pair = data[i].symbol;
  //         if (data[i].quoteVol != undefined ) {
  //           rlt.vol = data[i].quoteVol;
  //         }
  //         else {
  //           rlt.vol = -1;
  //         }
  //         if (data[i].average != undefined ) {
  //           rlt.price = data[i].average;
  //         }
  //         else {
  //           rlt.price = -1;
  //         }
  //         result.push(rlt);
  //       }
  //       return cb(null, result);
  //     }
  //   });
  // }

  // CoinData.getDetailCount = function(symbol, cb) {
  //   app.models.Tickers.count({symbol: symbol}, function(err, data) {
  //     if (err) {
  //       console.log(err);
  //       throw err;
  //     } else {
  //       return cb(null, data);
  //     }
  //   })
  // }

  // CoinData.getDetailInfo = function(symbol, cb) {
  //   app.models.Tickers.find({where: {symbol: symbol}}, function(err, data) {
  //     if (err) {
  //       console.log(err);
  //       throw err;
  //     } else {
  //       return cb(null, data);
  //     }
  //   })
  // }


  // CoinData.remoteMethod(
  //   'getSymbolDetail', {
  //     accepts: [
  //       { arg: 'symbol', type: 'string' },
  //       { arg: 'startNumber', type: 'number'},
  //       { arg: 'limit', type: 'number'}
  //     ],
  //     description: [
  //       'get all detail information with specific symbol',
  //       'example: symbol = "BTC"'
  //     ],
  //     http: {path: '/getdetailsymbol', verb: 'get'},
  //     returns: {arg: 'res', type: 'array'}
  //   }
  // )

  // CoinData.remoteMethod(
  //   'getDetailCount', {
  //     accepts: [
  //       { arg: 'symbol', type: 'string' },
  //     ],
  //     description: [
  //       'get count of all detail information with specific symbol',
  //       'example: symbol = "BTC"'
  //     ],
  //     http: {path: '/getdetailcount', verb: 'get'},
  //     returns: { arg: 'res', type: 'number' }
  //   }
  // )

  // CoinData.remoteMethod(
  //   'getDetailCount', {
  //     accepts: [
  //       { arg: 'symbol', type: 'string' },
  //     ],
  //     description: [
  //       'get count of all detail information with specific symbol',
  //       'example: symbol = "BTC"'
  //     ],
  //     http: {path: '/getdetailcount', verb: 'get'},
  //     returns: { arg: 'res', type: 'number' }
  //   }
  // )



  CoinData.resetAllCoins = function(cb) {
    (async() => {
      let count = 0;
      try {
        const cmc = new ccxt.coinmarketcap();
        await cmc.loadMarkets();
        const coins = Object.keys(cmc.currencies);
        await Promise.all(coins.map(async id => {
          const coin = cmc.currencies[id];
          // const url = 'http://coinscout.eu/api/containers/coin_icon/download/' + coin.info.id + '.png';
          const url = 'http://coinscout.eu/storage/coin_icon/' + coin.info.id + '.png';
          // const baseUrl = await getBase64FromImageUrl(url);
          await CoinData.updateCoinDataDB({
            // icon: baseUrl ? baseUrl : '',
            icon: url,
            name: coin.name,
            base_name: coin.code,
            coin_id: coin.id,
            price_usd: coin.info['price_usd'],
            price_btc: coin.info['price_btc'],
            rank: coin.info['rank'],

            market_cap_usd: coin.info['market_cap_usd'],
            circul_supply: coin.info['available_supply'],
            total_supply: coin.info['total_supply'],
            updated: coin.info['last_updated'],
            percent_change_1h: coin.info['percent_change_1h'],
            percent_change_24h: coin.info['percent_change_24h'],
            percent_change_7d: coin.info['percent_change_7d'],
            '24h_volume_usd': coin.info['24h_volume_usd'],
          });
          count++;
        }));
        cb(null, count);
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
        }
      }

    })()
  }

  async function getBase64FromImageUrl(url) {
    return new Promise((resolve, reject) => {
      base64Img.base64(url, function(err, data) {
        if (err) {
          return resolve();
        } else {
          return resolve(data);
        }
      })
    });
  }

  CoinData.updateCoinDataDB = async function(data) {
    return new Promise((resolve, reject) => {
      data.updateAt = Date.now();
      CoinData.upsertWithWhere({ coin_id: data.coin_id, base_name: data.base_name }, data, (err, model) => {
        if (err) {
          console.log(err);
          return reject(err);
        } else {
          console.log('updatecoindatadb', data.coin_id)
          return resolve();
        }
      });
    });
  }

  CoinData.remoteMethod(
    'resetAllCoins', {
        accepts: [],
        description: [
          'set All coin data'
        ],
        http: { path: '/resetallcoins', verb: 'post'},
        returns: { arg: 'res', type: 'string' }
    }
  )

  // get Coin
  CoinData.getCoinData = function(id, cb) {
    CoinData.find({ where: {coin_id: id} }, function(err, data) {
      if (err) {
        console.log(err);
      } else {
        return cb(null, data);
      }
    })
  }

  CoinData.remoteMethod(
    'getCoinData', {
      accepts: [
        { arg: 'id', type: 'string' }
      ],
      description: [
        'get coin info'
      ],
      http: {path: '/getcoin', verb: 'get'},
      returns: { arg: 'res', type: 'object' }
    }
  )

  // get Coin with Name
  CoinData.getCoinDataWithName = function(name, cb) {
    CoinData.find({ where: {name: name} }, function(err, data) {
      if (err) {
        console.log(err);
      } else {
        return cb(null, data);
      }
    })
  }

  CoinData.remoteMethod(
    'getCoinDataWithName', {
      accepts: [
        { arg: 'name', type: 'string' }
      ],
      description: [
        'get coin info'
      ],
      http: {path: '/getcoinwithname', verb: 'get'},
      returns: { arg: 'res', type: 'object' }
    }
  )

  // Set Coin
  CoinData.setCoinData = function(data, cb) {
    (async() => {
      try {
        await CoinData.updateCoinDataDB(data);
        cb(null, 'success: ' + data.coin_id);
      } catch(e) {
        cb(null, e);
      }
    })()
  }

  CoinData.remoteMethod(
    'setCoinData', {
      accepts: [
        { arg: 'data', type: 'object' }
      ],
      description: [
        'save coin info'
      ],
      http: {path: '/setcoin', verb: 'put'},
      returns: { arg: 'res', type: 'string' }
    }
  )

  // Remove Coin
  CoinData.removeCoinData = function(id, cb) {
    CoinData.remove({ coin_id: id }, function(err, data) {
      if (err) {
        console.log(err);
      } else {
        return cb(null, data);
      }
    })
  }

  CoinData.remoteMethod(
    'removeCoinData', {
      accepts: [
        { arg: 'id', type: 'string' }
      ],
      description: [
        'remove coin info'
      ],
      http: {path: '/removecoin', verb: 'post'},
      returns: { arg: 'res', type: 'string' }
    }
  )

  // Top Coin
  CoinData.getTopCoins = function(number, cb) {
    CoinData.find({ order: 'rank ASC', limit:number }, function(err, data) {
      if (err) {
        console.log(err);
      } else {
        return cb(null, data);
      }
    })
  }

  CoinData.remoteMethod(
    'getTopCoins', {
      accepts: [
        { arg: 'number', type: 'number' }
      ],
      description: [
        'get top coin'
      ],
      http: {path: '/topcoins', verb: 'get'},
      returns: { arg: 'res', type: 'object' }
    }
  )


  // Update Price
  CoinData.updateInfor = async function(base_name) {
    const coins = await asyncGetCoinData();
    // await Promise.all(coins.map(async coin => {
    for (let i = 0; i < coins.length; i++) {
      let coin = coins[i];
      // if (coin.base_name != 'BTC') {
      //   console.log('ppp');
      //   continue;
      // }
      const info = await getCoinInfor(coin.base_name);
      coin.change = (coin.price_usd - info.price) / info.price;
      coin.price_usd = info.price;
      coin['24h_volume_usd'] = info.vol_24;
      await CoinData.updateCoinDataDB(coin);
    }
    // }))
  }
  CoinData.asyncGetCoinData = async function() {
    return new Promise((resolve, reject) => {
      CoinData.find({}, function(err, data) {
        if (err) {
          console.log(err);
        } else {
          return resolve(data);
        }
      })
    });
  }
  let getCoinInfor = async function(basename) {
    return new Promise((resolve, reject) => {
      app.models.Ticket24.get24hInfo(basename, 'USD', function(that, results) {
        let amount = 0, volume = 0;
        for (let i = 0; i < results.length; i++) {
          const ticker =  results[i];
          if (ticker.price) {
            amount += (ticker.volume / ticker.price);
            volume += (ticker.volume);
          }
        }
        const vwap = volume / amount;
        return resolve({
          price: vwap,
          vol_24: volume,
        });
      })
    });
  }
};
