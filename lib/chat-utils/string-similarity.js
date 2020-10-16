const fastLevenshtein = require('fast-levenshtein');

/**
 * @param {string} oldMessage
 * @param {string} newMessage
 */
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
  return (longerLength - fastLevenshtein.get(longerMessage, shorterMessage)) / longerLength;
}

module.exports = similarity;
