const fastLevenshtein = require('fast-levenshtein');

function similarity(oldMessage, newMessage) {
  let longerMessage = oldMessage;
  let shorterMessage = newMessage;
  if (oldMessage.length < newMessage.length) {
    longerMessage = newMessage;
    shorterMessage = oldMessage;
  }
  const longerLength = longerMessage.length;
  if (longerLength === 0) {
    return 1.0;
  }
  return (
    (longerLength - fastLevenshtein.get(longerMessage, shorterMessage)) / parseFloat(longerLength)
  );
}

module.exports = similarity;
