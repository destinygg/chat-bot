const linkRegex = require('../chat-utils/link-regex');

module.exports = {
  hasLink(message) {
    return linkRegex.test(message);
  },
  getLinks(message) {
    return Array.from(message.matchAll(new RegExp(linkRegex, 'g')), (k) => new URL(k[0]));
  },
  mentionsUser(message, user) {
    if (!user) return false;
    const regex = new RegExp(`((?:^|\\s)@?)(${user.toLowerCase()})(?=$|\\s|[?!,]|\\.(?!\\S))`, 'i');
    return regex.test(message);
  },
};
