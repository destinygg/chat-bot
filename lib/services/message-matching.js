const linkRegex = require('../chat-utils/link-regex');

module.exports = {
  hasLink(message) {
    return linkRegex.test(message);
  },
  mentionsUser(message, user) {
    if (!user) return false;
    const regex = new RegExp(`(?<!\\S)(${user.toLowerCase()})(?!\\S)`, 'i');
    return regex.test(message);
  },
};
