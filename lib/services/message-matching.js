const linkRegex = require('../chat-utils/link-regex');

module.exports = {
  /**
   * @param {string} message
   */
  hasLink(message) {
    return linkRegex.test(message);
  },
  /**
   * @param {string} message
   * @param {string} user
   */
  mentionsUser(message, user) {
    if (!user) return false;
    const regex = new RegExp(`((?:^|\\s)@?)(${user.toLowerCase()})(?=$|\\s|[?!,]|\\.(?!\\S))`, 'i');
    return regex.test(message);
  },
};
