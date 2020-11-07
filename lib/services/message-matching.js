const linkRegex = require('../chat-utils/link-regex');

module.exports = {
  hasLink(message) {
    return linkRegex.test(message);
  },
  hasTwitterLink(message) {
    return this.hasLink(message) && message.match(/twitter\.com/gi);
  },
  mentionsUser(message, user) {
    if (!user) return false;
    const regex = new RegExp(`((?:^|\\s)@?)(${user.toLowerCase()})(?=$|\\s|[?!,]|\\.(?!\\S))`, 'i');
    return regex.test(message);
  },
};
