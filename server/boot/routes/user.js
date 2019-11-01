
'use strict';

var dsConfig = require('../../datasources.json');
var path = require('path');

module.exports = function(app) {
  var router = app.loopback.Router();
  var User = app.models.user;

  //login page
  app.get('/', function(req, res) {
    var credentials = dsConfig.emailDs.transports[0].auth;
    res.render('login', {
      // email: credentials.user,
      // password: credentials.pass,
    });
  });


  app.get('/login', function(req, res) {
    res.render('login', {
    });
  });
  app.get('/register', function(req, res) {
    res.render('register', {
    });
  });

  //verified
  app.get('/verified', function(req, res) {
    res.render('verified');
  });

  //log a user in
  /*app.post('/login', function(req, res) {
    User.login({
      email: req.body.email,
      password: req.body.password
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
          res.send({
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
          res.send({
            title: 'Login failed. Wrong username or password',
            content: err,
          });
        }
        return;
      }
      res.send({
        accessToken: 'access-token-' + token.id,
        refreshToken: 'access-token-' + token.id
      })
      // res.render('home', {
      //   email: req.body.email,
      //   accessToken: token.id,
      //   redirectUrl: '/api/users/change-password?access_token=' + token.id
      // });
    });
  });*/

  //log a user out
  app.get('/logout', function(req, res, next) {
    if (!req.accessToken) return res.sendStatus(401);
    User.logout(req.accessToken.id, function(err) {
      if (err) return next(err);
      res.redirect('/');
    });
  });

  //send an email with instructions to reset an existing user's password
  app.post('/request-password-reset', function(req, res, next) {
    User.resetPassword({
      email: req.body.email
    }, function(err) {
      if (err) return res.status(401).send(err);

      res.render('response', {
        title: 'Password reset requested',
        content: 'Check your email for further instructions',
        redirectTo: '/',
        redirectToLinkText: 'Log in'
      });
    });
  });

  //show password reset form
  app.get('/reset-password', function(req, res, next) {
    if (!req.accessToken) return res.sendStatus(401);
    res.render('password-reset', {
      redirectUrl: '/api/users/reset-password?access_token='+
        req.accessToken.id
    });
  });
}
