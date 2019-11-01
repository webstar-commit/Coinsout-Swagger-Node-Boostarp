'use strict';

module.exports = function(Profile) {

  // get Coin
  Profile.getProfile = function(id, cb) {
    Profile.find({ where: {id: id} }, function(err, data) {
      if (err) {
        console.log(err);
      } else {
        return cb(null, data);
      }
    })
  }

  Profile.remoteMethod(
    'getProfile', {
      accepts: [
        { arg: 'id', type: 'string' }
      ],
      description: [
        'get user profile'
      ],
      http: {path: '/getprofile', verb: 'get'},
      returns: { arg: 'res', type: 'object' }
    }
  )

  // Remove Coin
  Profile.removeUser = function(id, cb) {
    Profile.remove({ id: id }, function(err, data) {
      if (err) {
        console.log(err);
      } else {
        return cb(null, data);
      }
    })
  }

  Profile.remoteMethod(
    'removeUser', {
      accepts: [
        { arg: 'id', type: 'string' }
      ],
      description: [
        'remove user profile'
      ],
      http: {path: '/removeprofile', verb: 'post'},
      returns: { arg: 'res', type: 'string' }
    }
  )
};
