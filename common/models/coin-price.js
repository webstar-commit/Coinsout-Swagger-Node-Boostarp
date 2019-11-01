
'use strict';


module.exports = function(CoinPrice) {
  CoinPrice.getAllCurrency = function(cb) {
    CoinPrice.find({}, function(err, data) {
      if (err) {
        console.log(err);
        cb(null, null);
      } else {
        let result = {};
        data.map(currency => {
          result[currency.currency] = {
            btc: currency.btc,
            etc: currency.etc,
            percent_change_24h: currency.percent_change_24h
          }
        })
        cb(null, result);
      }
    })
  }

  CoinPrice.remoteMethod(
    'getAllCurrency', {
        accepts: [],
        description: [
          'get All currecny price'
        ],
        http: { path: '/getallprice', verb: 'get'},
        returns: { arg: 'res', type: 'string' }
    }
  )

  CoinPrice.getAllBTCPrice = async function() {
    return new Promise((resolve, reject) => {
      CoinPrice.getAllCurrency(function(that, results) {
        if (results) {
          return resolve(results);
        } else {
          reject('error');
        }
      })
    });
  }

  // CoinPrice.updateDB = async function(currency, btc_price, etc_price) {
  //   return new Promise((resolve, reject) => {
  //     data = {
  //       currency: currency,
  //       btc: btc_price,
  //       etc: etc_price
  //     }
  //     CoinPrice.upsertWithWhere({currency, currency}, data, (err, model) => {
  //       if (err) {
  //         return reject(err);
  //       } else {
  //         return resolve();
  //       }
  //     })
  //   });
  // }

  CoinPrice.asyncGetCurreny = async function(currency) {
    return new Promise((resolve, reject) => {
      const query = {
        where: {
          currency: currency
        }
      }
      CoinPrice.find(query, (err, data) => {
        if (err) {
          return reject(err);
        } else {
          if (data.length > 0) {
            return resolve(data[0]);
          } else {
            return resolve();
          }
        }
      })
    })
  }
};
