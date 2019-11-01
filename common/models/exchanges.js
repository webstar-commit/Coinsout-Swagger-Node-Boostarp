// import { resolve } from 'url';
// import { reject } from './C:/Users/highdev/AppData/Local/Microsoft/TypeScript/2.6/node_modules/@types/async';

'use strict';

const ccxt = require('ccxt');

module.exports = function(Exchanges) {
  Exchanges.resetAllExchanges = function(cb) {
    (async() => {
      let count = 0;
      const errorExchanges = [];
      await Promise.all(ccxt.exchanges.map(async id => {
        try {
          let exchange = new (ccxt)[id]();
          await exchange.loadMarkets();
          const data = {
            logo: exchange.urls.logo,
            name: exchange.name,
            website: exchange.urls.www,
            country: exchange.countries,
            status: 'OK',
            last_update: Date.now(),
            exchange_id: exchange.id,
            exchange_type: 'exchange',
            pairs: exchange.symbols.length,
            symbols: JSON.stringify(exchange.symbols),
            isFetchTrade: exchange.hasFetchTrades,
            isFetchOrder: exchange.hasFetchOrderBook,
          }
          if (!data.exchange_id) data.exchange_id = exchange.name;
          if (!exchange.markets) data.status = 'Error Code';
          await updateExchangesDB(data);
          count++;
        } catch(e) {
          errorExchanges.push(id);
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
      }))

      await Promise.all(errorExchanges.map(async id => {
        let exchange = new (ccxt)[id]();
        const data = {
          logo: exchange.urls.logo,
          name: exchange.name,
          website: exchange.urls.www,
          country: exchange.countries,
          status: 'Error Code',
          last_update: Date.now(),
          exchange_id: exchange.id,
          exchange_type: 'exchange',
        }
        await updateExchangesDB(data);
      }))
      cb(null, count + ' of ' + ccxt.exchanges.length);
    })()
  }

  async function updateExchangesDB(data) {
    return new Promise((resolve, reject) => {
      Exchanges.upsertWithWhere({ exchange_id:data.exchange_id }, data, (err, model) => {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }


  Exchanges.remoteMethod(
    'resetAllExchanges', {
        accepts: [],
        description: [
          'set All exchanges'
        ],
        http: { path: '/resetallexchanges', verb: 'post'},
        returns: { arg: 'res', type: 'string' }
    }
  )

  // Exchanges.remoteMethod(
  //   'getAllExchanges', {
  //     accepts: [
  //     ],
  //     description: [
  //       'get info all exchanges'
  //     ],
  //     http: {path: '/getallexchanges', verb: 'get'},
  //     returns: { arg: 'data', type: 'object' }
  //   }
  // )

  // get Exchange
  Exchanges.getExchangeWidthID = function(id, cb) {
    Exchanges.find({ where: {exchange_id: id} }, function(err, data) {
      if (err) {
        console.log(err);
      } else {
        return cb(null, data);
      }
    })
  }
  Exchanges.remoteMethod(
    'getExchangeWidthID', {
      accepts: [
        { arg: 'id', type: 'string' }
      ],
      description: [
        'get exchanges info'
      ],
      http: {path: '/getexchange', verb: 'get'},
      returns: { arg: 'res', type: 'object' }
    }
  )

  // set Exchange
  Exchanges.setExchangeData = function(data, cb) {
    (async() => {
      try {
        await updateExchangesDB(data);
        cb(null, 'success: ' + data.exchange_id);
      } catch(e) {
        console.log(e);
      }
    })()
  }
  Exchanges.remoteMethod(
    'setExchangeData', {
      accepts: [
        { arg: 'data', type: 'object' }
      ],
      description: [
        'save exchanges info'
      ],
      http: {path: '/setexchange', verb: 'put'},
      returns: { arg: 'res', type: 'string' }
    }
  )

  Exchanges.updateVolume = async function(exchange_id, volume24) {
    return new Promise((resolve, reject) => {
      Exchanges.find({ where: {exchange_id: exchange_id} }, function(err, exchange_data) {
        if (err) {
          return reject(err);
        } else {
          if (exchange_data.length > 0) {
            exchange_data[0].volume24 = volume24;
            Exchanges.upsertWithWhere({exchange_id: exchange_id}, exchange_data[0], (err, model) => {
              if (err) {
                return reject(err);
              } else {
                return resolve();
              }
            })
          } else {
            return resolve();
          }
        }
      });
    })
  }

  Exchanges.asyncGetAllExchanges = async function() {
    return new Promise((resolve, reject) => {

      Exchanges.find({}, function(err, data) {
        if (err) {
          console.log(err);
          return reject(err);
        } else {
          return resolve(data);
        }
      })
    })
  }

};
