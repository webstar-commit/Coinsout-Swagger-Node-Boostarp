# coinscout-swagger

**Synopsis**

This project is backend project for coinscout

**environment**

mongodb 3.4

node 8.0

**Code Example**

**Motivation**

The project is generated by [LoopBack](http://loopback.io).

**Installation**

npm install

node .

http://localhost:5000

**API Reference**

- api/users (POST): user signup

  param: firstname, lastname, user mail, password

  result: success

- api/users/loginuser (POST): user login

  param: user email, password

  result: token

- api/CoinData/topcoins (GET): get top coins (ordered by total volume)

  param: void

  result: coin's array

- api/CoinData/getcoinwithname (GET): get coin info with name

  param: coin name

  result: coin's id

- api/CoinData (GET): get all currencies's info

  param: void

  result: currency's array

- api/FiatCurrencies/getfiatrate (GET): get usd rate of fiat currency

  param: void

  result: currency usd rate

- api/CoinData/getcoin (GET): get one currency's info

  param: currency id

  result: currency's info

- api/ticket24s/get24info (GET): get 24h info of a currency

  param: base and quote of currency

  result: 24h volume, price change and price

- api/exchanges: get info of all exchnages

  param: void

  result: volume, id, name of all exchanges

- api/exchanges/getexchange (GET): get info of a exchange

  param: exchange id

  result: exchange 24h volume

- api/ticket24s/getexchange24 (GET): get 24h info of a exchange

  param: exchange id, quote

  result: exchange detail info based 24h

- api/orders/getorders2 (GET): get order info of a exchange

  param: exchange id

  result: rate by order



**Tests**

 npm test
