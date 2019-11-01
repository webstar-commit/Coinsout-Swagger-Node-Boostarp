'use strict';

module.exports = function(DataPoint4H) {
  DataPoint4H.getDataWithSymbol = function(symbol, cb) {
    const query = {
      order: 'timestamp DESC',
      where: {
        symbol: symbol,
        // timestamp: {
        //   gt: Date.now() - 1000 * 60 * 60 * 24 * 7
        // }
      },
      limit: 150
    }
    DataPoint4H.find(query, function(err, data) {
      if (err) {
        console.log(err);
      } else {
        return cb(null, data);
      }
    })
  }
  DataPoint4H.remoteMethod(
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
