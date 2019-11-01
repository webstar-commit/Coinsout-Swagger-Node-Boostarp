

'use strict';

module.exports = function(Orders) {
  Orders.getDataWithExchange = function(exchange, cb) {
    const query = {
      where: {
        exchange: exchange
      }
    };
    Orders.find(query, function(err, data) {
      if (err) {
        console.log(err);
        cb(err);
      } else {
        cb(null, data)
      }
    })
  };

  Orders.remoteMethod(
    'getDataWithExchange', {
      accepts: [
        { arg: 'exchange', type: 'string'},
      ],
      description: [
        'get Orders from specific exchange',
        'example: exchange = "bitfinex"'
      ],
      http: { path: '/getorders2', verb: 'get'},
      returns: { arg: 'res', type: 'string' }
    }
  );

};
