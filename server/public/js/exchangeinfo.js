
$(document).ready(function() {
  const exchange_id = $('#exchange_id').text();
  const url_exchange = 'http://coinscout.eu/api/exchanges/getexchange?id=' + exchange_id;
  $.get( url_exchange, function(exchange_data) {
    if (!exchange_data.res[0]) {
      return;
    }
    const volume24 = exchange_data.res[0].volume24;
    const volume = volume24 ? (volume24 - 0).toFixed(2) - 0 : 0;
    $('#volume_24').text(volume.toLocaleString());

    const logo = exchange_data.res[0].logo;
    $('.exch-company img').attr('src', logo);

    const url = 'http://coinscout.eu/api/ticket24s/getexchange24?exchange=' + exchange_id + '&quote_param=USD';
    $.get( url, function(data) {
      const url_orders = 'http://coinscout.eu/api/orders/getorders2?exchange=' + exchange_id;
      $.get( url_orders, function(orders) {
        order_data = {};
        orders.res.map(order => {
          order_data[order.symbol] = order;
        })

        const coin_data = data.res.symbol_data;

        table_data = [];
        for (let i = 0; i < coin_data.length; i++) {
          const row = coin_data[i];
          const symbol = row.code + '/' + row.quote;
          let bid, ask;
          if (order_data[symbol]) {
            bid = order_data[symbol].bid;
            ask = order_data[symbol].ask;
          }
          bid = bid ? (bid * 100).toFixed(2) + '%' : 'N/A';
          ask = ask ? (ask * 100).toFixed(2) + '%' : 'N/A';
          if (row) {
            table_data.push([
              row.name,
              symbol,
              row.last ? (row.last - 0).toFixed(2) : 'N/A',
              row.volume ? (row.volume - 0).toFixed(2) : 'N/A',
              getChange(row, 3, true),
              getChange(row, 2, true),
              getChange(row, 1, true),
              getChange(row, 0, true),
              getChange(row, 3, false),
              getChange(row, 2, false),
              getChange(row, 1, false),
              getChange(row, 0, false),
              bid,
              ask,
            ])
          }
        }
        $('#market').DataTable({
          "paginate": true,
          "processing": true,
          data: table_data,
          columns: [
              { title: "Name" },
              { title: "Code" },
              { title: "Last" },
              { title: "Volume" },
              { title: "24hr" },
              { title: "1hr" },
              { title: "30 min" },
              { title: "15 min" },
              { title: "24hr" },
              { title: "1hr" },
              { title: "30 min" },
              { title: "15 min" },
              { title: "Buyers" },
              { title: "Sellers" }
          ],
          "order": [[ 3, "desc" ]]
        });
      });
    });
  });
})

function getChange(data, index, isPorV) {
  if (data.change) {
    if (data.change[index]) {
      if (isPorV) {
        return data.change[index].price ? (data.change[index].price * 100).toFixed(2) + '%' : '0%';
      } else {
        return data.change[index].volume ? (data.change[index].volume * 100).toFixed(2) + '%' : '0%';
      }
    }
  }
  return '0%';
}
