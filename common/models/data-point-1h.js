'use strict';

module.exports = function(DataPoint1H) {
  DataPoint1H.getDataWithSymbol = function(symbol, cb) {
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
    DataPoint1H.find(query, function(err, data) {
      if (err) {
        console.log(err);
      } else {
        return cb(null, data);
      }
    })
  }
  DataPoint1H.remoteMethod(
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
