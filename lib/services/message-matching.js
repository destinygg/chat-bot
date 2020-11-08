const linkRegex = require('../chat-utils/link-regex');

module.exports = {
  hasLink(message) {
    return linkRegex.test(message);
  },
  hasTwitterLink(message) {
    return linkRegex.test(message) && message.match(/twitter\.com/gi);
  },
  getLinks(message) {
    return Array.from(message.matchAll(new RegExp(linkRegex, 'g')), (k) => k[0]);
  },
  mentionsUser(message, user) {
    if (!user) return false;
    const regex = new RegExp(`((?:^|\\s)@?)(${user.toLowerCase()})(?=$|\\s|[?!,]|\\.(?!\\S))`, 'i');
    return regex.test(message);
  },
};
