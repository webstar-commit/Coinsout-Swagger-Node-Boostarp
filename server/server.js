
'use strict';

var loopback = require('loopback');
var boot = require('loopback-boot');
var path = require('path');
var bodyParser = require('body-parser');
var exphbs = require('express-handlebars');

var app = module.exports = loopback();

var ccxtMain = require('./../bin/ccxt/ccxt-main');
var ccxtSocket = require('./../bin/ccxt/ccxt-socket');

// configure view handler
// app.set('view engine', 'jade');
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', exphbs({helpers: {
  toJSON : function(object) {
    return JSON.stringify(object);
  }
}}));
app.set('view engine', 'handlebars');

// configure body parser
app.use(bodyParser.urlencoded({extended: true}));
app.use(loopback.static(path.join(__dirname, 'public')));

app.use(loopback.token());

app.start = function() {
  // start the web server
  return app.listen(function() {
    app.emit('started');
    var baseUrl = app.get('url').replace(/\/$/, '');
    console.log('Web server listening at: %s', baseUrl);
    if (app.get('loopback-component-explorer')) {
      var explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
    }

    ccxtMain.main(app);
    ccxtSocket.start(app);

    app.models.Ticket24.updatePriceList();
    app.models.CoinData.updateTotalMarket();
    setInterval(function() {
      app.models.Ticket24.updatePriceList();
      app.models.CoinData.updateTotalMarket();
    }, 1000 * 60 * 15);
  });
};

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function(err) {
  if (err) throw err;

  // start the server if `$ node server.js`
  if (require.main === module)
    app.start();
});

