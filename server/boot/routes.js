// Copyright IBM Corp. 2014,2015. All Rights Reserved.
// Node module: loopback-example-user-management
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

var dsConfig = require('../datasources.json');
var path = require('path');

var userpage = require('./routes/user');
var detailpage = require('./routes/detailpage');

module.exports = function(app) {
  console.log('****');

  app.get('/home', function(req, res) {
    res.render('home', {
    });
  });
  app.get('/top100', function(req, res) {
    res.render('top100', {
    });
  });
  app.get('/portfolios', function(req, res) {
    res.render('portfolios', {
    });
  });
  app.get('/listview', function(req, res) {
    res.render('listview', {
    });
  });
  app.get('/screener', function(req, res) {
    res.render('screener', {
    });
  });
  app.get('/arbitrage', function(req, res) {
    res.render('arbitrage', {
    });
  });
  app.get('/exchanges', function(req, res) {
    res.render('exchanges', {
    });
  });
  app.get('/exchangeInfo', function(req, res) {
    const exchange_id = req.param('id');
    res.render('exchangeInfo', {
      exchange_id: exchange_id
    });
  });

  userpage(app);
  detailpage(app);

};
