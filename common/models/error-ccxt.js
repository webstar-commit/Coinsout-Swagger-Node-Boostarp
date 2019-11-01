'use strict';

module.exports = function(ErrorCCXT) {
  ErrorCCXT.updateDBError = async function(title, exchange, errorkey, content) {
    return new Promise((resolve, reject) => {
      const data = {
        title: title,
        exchange: exchange,
        errorkey: errorkey,
        content: content,
        updateAt: Date.now(),
      }
      ErrorCCXT.create(data, (err, model) => {
        if (err) {
          return reject(err);
        } else {
          return resolve();
        }
      })
    })
  }
};
