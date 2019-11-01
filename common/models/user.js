// Copyright IBM Corp. 2014,2015. All Rights Reserved.
// Node module: loopback-example-user-management
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

var config = require('../../server/config.json');
var path = require('path');
var senderAddress = "noreply@loopback.com"; //Replace this address with your actual address
const app = require('../../server/server');

module.exports = function(User) {
  //send verification email after registration
  User.afterRemote('create', function(context, user, next) {
    var options = {
      type: 'email',
      to: user.email,
      from: senderAddress,
      subject: 'Thanks for registering.',
      template: path.resolve(__dirname, '../../server/views/verify.ejs'),
      redirect: '/verified',
      user: user
    };

    // user.verify(options, function(err, response) {
    //   if (err) {
    //     User.deleteById(user.id);
    //     return next(err);
    //   }
    //   context.res.render('response', {
    //     title: 'Signed up successfully',
    //     content: 'Please check your email and click on the verification link ' +
    //       'before logging in.',
    //     redirectTo: '/',
    //     redirectToLinkText: 'Log in'
    //   });
    // });
    context.res.send({
      title: 'Signed up successfully',
      redirectTo: '/',
    })
    // context.res.redirect('/');
  });

  // Method to render
  User.afterRemote('prototype.verify', function(context, user, next) {
    context.res.render('response', {
      title: 'A Link to reverify your identity has been sent '+
        'to your email successfully',
      content: 'Please check your email and click on the verification link '+
        'before logging in',
      redirectTo: '/',
      redirectToLinkText: 'Log in'
    });
  });

  //send password reset link when requested
  User.on('resetPasswordRequest', function(info) {
    var url = 'http://' + config.host + ':' + config.port + '/reset-password';
    var html = 'Click <a href="' + url + '?access_token=' +
        info.accessToken.id + '">here</a> to reset your password';

    User.app.models.Email.send({
      to: info.email,
      from: senderAddress,
      subject: 'Password reset',
      html: html
    }, function(err) {
      if (err) return console.log('> error sending password reset email');
      console.log('> sending password reset email to:', info.email);
    });
  });

  //render UI page after password change
  User.afterRemote('changePassword', function(context, user, next) {
    context.res.render('response', {
      title: 'Password changed successfully',
      content: 'Please login again with new password',
      redirectTo: '/',
      redirectToLinkText: 'Log in'
    });
  });

  //render UI page after password reset
  User.afterRemote('setPassword', function(context, user, next) {
    context.res.render('response', {
      title: 'Password reset success',
      content: 'Your password has been reset successfully',
      redirectTo: '/',
      redirectToLinkText: 'Log in'
    });
  });


  User.loginUser = function(email, password, cb) {
    User.login({
      email: email,
      password: password
    }, 'user', function(err, token) {
      if (err) {
        if(err.details && err.code === 'LOGIN_FAILED_EMAIL_NOT_VERIFIED'){
          // res.render('reponseToTriggerEmail', {
          //   title: 'Login failed',
          //   content: err,
          //   redirectToEmail: '/api/users/'+ err.details.userId + '/verify',
          //   redirectTo: '/',
          //   redirectToLinkText: 'Click here',
          //   userId: err.details.userId
          // });
          cb(null, {
            type: 'reponseToTriggerEmail',
            title: 'Login failed',
            redirectToEmail: '/api/users/'+ err.details.userId + '/verify',
            userId: err.details.userId,
            content: err,
          });
        } else {
          // res.render('response', {
          //   title: 'Login failed. Wrong username or password',
          //   content: err,
          //   redirectTo: '/',
          //   redirectToLinkText: 'Please login again',
          // });
          cb(null, {
            title: 'Login failed. Wrong username or password',
            content: err,
          });
        }
        return;
      }
      cb(null, {
        status: 'ok',
        accessToken: token.id,
        refreshToken: token.id
      });
      // res.render('home', {
      //   email: req.body.email,
      //   accessToken: token.id,
      //   redirectUrl: '/api/users/change-password?access_token=' + token.id
      // });
    });
  }

  User.remoteMethod(
    'loginUser', {
      accepts: [
        { arg: 'email', type: 'string'},
        { arg: 'password', type: 'string'},
      ],
      description: [
        'login'
      ],
      http: { path: '/loginuser', verb: 'get' },
      returns: { arg: 'res', type: 'object' }
    }
  )


  // User.signupUser = function(fistname, lastname, email, password, cb) {
  //   User.create({
  //     email: email,
  //     password: password
  //   }, 'user', function(err, token) {
  //     if (err) {
  //       return cb(null, err);
  //     }
  //     cb(null, {
  //       status: 'ok',
  //       accessToken: token.id,
  //       refreshToken: token.id
  //     });
  //     // res.render('home', {
  //     //   email: req.body.email,
  //     //   accessToken: token.id,
  //     //   redirectUrl: '/api/users/change-password?access_token=' + token.id
  //     // });
  //   });
  // }

  // User.remoteMethod(
  //   'signupUser', {
  //     accepts: [
  //       { arg: 'firstname', type: 'string'},
  //       { arg: 'lastname', type: 'string'},
  //       { arg: 'email', type: 'string'},
  //       { arg: 'password', type: 'string'},
  //     ],
  //     description: [
  //       'login'
  //     ],
  //     http: { path: '/signupuser', verb: 'get' },
  //     returns: { arg: 'res', type: 'object' }
  //   }
  // )

  User.getUserFromAccessToken = function(token, cb) {
    const query = {
      where: {
        _id: token
      }
    }
    app.models.AccessToken.find(query, function(err, data) {
      if (err) {
        return cb(null, err);
      }
      if (data.length > 0) {
        const userId = data[0].userId.toString();
        // return cb(null, data[0]);
        const query2 = {
          where: {
            _id: userId
          }
        }
        User.find(query2, function(err, user_data) {
          if (err) {
            return cb(null, err);
          } else {
            if (user_data.length > 0) {
              return cb(null, user_data[0]);
            }
            return cb(null);
          }
        })
      } else {
        return cb(null);
      }
      // res.render('home', {
      //   email: req.body.email,
      //   accessToken: token.id,
      //   redirectUrl: '/api/users/change-password?access_token=' + token.id
      // });
    });
  }

  User.remoteMethod(
    'getUserFromAccessToken', {
      accepts: [
        { arg: 'token', type: 'string'},
      ],
      description: [
        'get UserId from AccessToken'
      ],
      http: { path: '/getuser_token', verb: 'get' },
      returns: { arg: 'res', type: 'object' }
    }
  )


  User.updateTrends = function(userId, trends, cb) {
    const data = {
      userId: userId,
      trends: trends
    }
    const query = {
      where: {
        _id: userId
      }
    }
    User.find(query, (err, model) => {
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
        }
      }
    })
  };
  User.remoteMethod(
    'updateTrends', {
      http: {
        path: '/updatetrends',
        verb: 'post'
      },
      accepts: [
        { arg: 'userId', type: 'string' },
        { arg: 'trends', type: 'string' }
      ],
      returns: {
        arg: 'res',
        type: 'string'
      }
    }
  );

  User.getTrends = function(userId, cb) {
    const query = {
      where: {
        _id: userId
      }
    }
    User.find(query, function(err, data) {
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
  User.remoteMethod(
    'getTrends', {
      http: {
        path: '/getTrends',
        verb: 'get'
      },
      accepts: [
        { arg: 'userId', type: 'string' }
      ],
      returns: {
        arg: 'res',
        type: 'string'
      }
    }
  );
};
