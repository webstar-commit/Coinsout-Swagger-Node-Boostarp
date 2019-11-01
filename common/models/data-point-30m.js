'use strict';

const app = require('../../server/server')

module.exports = function(DataPoint30M) {
  DataPoint30M.getDataWithSymbol = function(symbol, cb) {
    const query = {
      order: 'timestamp DESC',
      where: {
        symbol: symbol,
        // timestamp: {
        //   gt: Date.now() - 1000 * 60 * 60 * 24 * 3
        // }
      },
      limit: 150
    }
    DataPoint30M.find(query, function(err, data) {
      if (err) {
        console.log(err);
      } else {
        return cb(null, data);
      }
    })
  }
  DataPoint30M.remoteMethod(
    'getDataWithSymbol', {
      accepts: [
        { arg: 'symbol', type: 'string' }
      ],
      description: [
        'get data points for a day'
      ],
      http: {path: '/getdata', verb: 'get'},
      returns: { arg: 'res', type: 'object' }
    }
  )
};
