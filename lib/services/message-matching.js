const linkRegex = require('../chat-utils/link-regex');

module.exports = {
  hasLink(message) {
    return linkRegex.test(message);
  },
  mentionsUser(message, user) {
    if (!user) return false;
    const regex = new RegExp(
      `((?:^|\\s)@?)(${user.toLowerCase()})(?=$|\\s|(?:\\?|\\!|\\,|\\.(?!\\S)))`,
      'i',
    );
    return regex.test(message);
  },
};
