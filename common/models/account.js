'use strict';

module.exports = function(Account) {
  Account.updateTrends = function(email, trends, cb) {
    const data = {
      email: email,
      trends: trends
    }
    const query = {
      where: {
        email: email
      }
    }
    Account.find(query, (err, model) => {
      if (err) {
        console.log(err);
      } else {
        if (model.length > 0) {
          model[0].updateAttribute('trends', trends, (err, data) => {
            if (err) {
              console.log(err);
            } else {
              return cb(null, 'ok');
            }
          })
        } else {
          Account.create(data, (err, model) => {
            if (err) {
              console.log(err);
            } else {
              return cb(null, 'ok');
            }
          })
        }
      }
    })
  };
  Account.remoteMethod(
    'updateTrends', {
      http: {
        path: '/updatetrends',
        verb: 'post'
      },
      accepts: [
        { arg: 'email', type: 'string' },
        { arg: 'trends', type: 'string' }
      ],
      returns: {
        arg: 'res',
        type: 'string'
      }
    }
  );

  Account.getTrends = function(email, cb) {
    const query = {
      where: {
        email: email
      }
    }
    Account.find(query, function(err, data) {
      if (err) {
        console.log(err);
      } else {
        if (data.length > 0) {
          return cb(null, data[0]);
        } else {
          return cb(null);
        }
      }
    })
  };
  Account.remoteMethod(
    'getTrends', {
      http: {
        path: '/getTrends',
        verb: 'get'
      },
      accepts: [
        { arg: 'email', type: 'string' }
      ],
      returns: {
        arg: 'res',
        type: 'string'
      }
    }
  );
};
