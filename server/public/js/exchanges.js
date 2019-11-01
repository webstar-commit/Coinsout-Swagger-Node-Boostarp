
$(document).ready(function() {
  getTotalMarket('USD', function(val) {
    const str = '$' + val.toLocaleString();
    $('#total_market_cap').text(str);
  });

  const url = 'http://coinscout.eu/api/exchanges';
  $('.grid-view.exch-list').empty();
  $.get( url, function(data) {
    let html = '';

    function compare(a, b) {
      if (a.volume24 < b.volume24)
        return 1;
      if (a.volume24 > b.volume24)
        return -1;
      return 0;
    }
    data.sort(compare);

    for (let i = 0; i < data.length; i++) {
      const exchange = data[i];
      let vol = exchange.volume24 - 0;
      vol = '$' + (vol.toFixed(2) - 0).toLocaleString();
      const url = '/exchangeInfo?id=' + exchange.exchange_id;
      html += htmlExchange(exchange.logo, i + 1, vol, exchange.website, exchange.pairs, exchange.country.split(','), '3h 34s', url);
    }
    $('.grid-view.exch-list').append(html);
  });
})

function getTotalMarket(quote, callback) {
  const url = 'http://coinscout.eu/api/CoinData';
  $.get( url, function(data) {
    let sum = 0;
    data.map(coin => {
      if (coin.market_cap_usd) {
        sum += (coin.market_cap_usd - 0);
      }
    })
    callback(sum);
  })
}

function htmlExchange(logo, rank, vol_24, website, pair_num, countries, updateAt, url) {
  let strCountries = '';
  for (let i = 0; i < countries.length; i++) {
    strCountries += '<li>';
    strCountries += countries[i];
    strCountries += '</li>';
  }
  const str = '\
    <div class="well">\
      <img src="' + logo + '" alt="" style="width: 70%;">\
      <div class="rank-btn pull-left">\
          <span class="label label-success label-block">' + rank + '</span>\
          <a href="' + website + '" class="btn btn-default btn-block">Website <i class="fa fa-link" aria-hidden="true"></i></a>\
      </div>\
      <div class="priceWrap pull-left">\
          <h2>24 hr Volume</h2>\
          <div class="price-vol">'
            + vol_24 +
          '</div>\
          <h4>' + pair_num + ' Trading Pairs</h4>\
      </div>\
      <div class="clearfix"></div>\
      <ul>'
          + strCountries +
      '</ul>\
      <div class="updateInfo">\
          <div class="label label-default">Last Update: ' + updateAt + '</div>\
          <a href="' + url + '" class="btn btn-default btn-block"> View More </a>\
      </div>\
    </div>';
  return str;
}

