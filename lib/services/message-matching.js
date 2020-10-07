const linkRegex = require('../chat-utils/link-regex');

module.exports = {
  hasLink(message) {
    return linkRegex.test(message);
  },
  mentionsUser(message, user) {
    if (!user) return false;
    const regex = new RegExp(`\\b(${user.toLowerCase()})\\b`, 'i');
    return regex.test(message);
  },
};
