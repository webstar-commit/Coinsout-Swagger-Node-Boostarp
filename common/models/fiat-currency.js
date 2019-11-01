'use strict';
const request = require('request');

module.exports = function(Fiatcurrency) {

  Fiatcurrency.getAllCurrency = function(cb) {
    Fiatcurrency.find({}, function(err, data) {
      if (err) {
        console.log(err);
      } else {
        let result = {};
        data.map(currency => {
          result[currency.currency] = currency.usd;
        })
        cb(null, result);
      }
    })
  }

  Fiatcurrency.remoteMethod(
    'getAllCurrency', {
        accepts: [],
        description: [
          'get All currecny data'
        ],
        http: { path: '/getall', verb: 'get'},
        returns: { arg: 'res', type: 'string' }
    }
  )

  Fiatcurrency.resetAllCurrency = async function(cb) {
    let count = 0;
    for (let i = 0; i < fiatCurrencies.length; i++) {
    // await Promise.all(fiatCurrencies.map(async currency => {
      try {
        const currency = fiatCurrencies[i];
        let rate = await getConvertFiatCurrency2(currency, 'usd');
        await updateDBCurrency({
          currency: currency,
          'usd': rate
        });
        count++;
      } catch(e) {
        console.log(e);
      }
    }
    cb(null, count);
  }

  Fiatcurrency.remoteMethod(
    'resetAllCurrency', {
        accepts: [],
        description: [
          'set All currecny data'
        ],
        http: { path: '/resetall', verb: 'post'},
        returns: { arg: 'res', type: 'string' }
    }
  )

  Fiatcurrency.getFiatCurrency = function(src, dst, cb) {
    (async() => {
      let rate = await getConvertFiatCurrency2(src, dst);
      cb(null, rate);
    })()
  }

  Fiatcurrency.remoteMethod(
    'getFiatCurrency', {
        accepts: [
          { arg: 'src', type: 'string' },
          { arg: 'dst', type: 'string' }
        ],
        description: [
          'get currecny'
        ],
        http: { path: '/getfiatrate', verb: 'get'},
        returns: { arg: 'res', type: 'number' }
    }
  )

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

  async function getConvertFiatCurrency2(src, dst) {
    return new Promise((resolve, reject) => {
      src = src.toLowerCase();
      dst = dst.toLowerCase();
      if (src == dst) {
        return 1.0;
      }
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

  let updateDBCurrency = async function(data) {
    return new Promise((resolve, reject) => {
      Fiatcurrency.upsertWithWhere( { currency: data.currency }, data, (err, model) => {
        if (err) {
          console.log(err);
          return reject(err);
        } else {
          return resolve();
        }
      });
    });
  }

  Fiatcurrency.asyncGetAllCurrency = async function() {
    return new Promise((resolve, reject) => {
      Fiatcurrency.getAllCurrency(function(that, results) {
        if (results) {
          return resolve(results);
        } else {
          return reject('error');
        }
      })
    })
  }

};
