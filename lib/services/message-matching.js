const linkRegex = require('../chat-utils/link-regex');

module.exports = {
  hasLink(message) {
    return linkRegex.test(message);
  },
  getLinks(message) {
    return Array.from(
      message.matchAll(new RegExp(linkRegex, 'gi')),
      (k) => (k[0].startsWith('http') ? k[0] : `http://${k[0]}`), // add protocol to link
    )
      .map((link) => {
        try {
          return new URL(link); // crash protection
        } catch (e) {
          return null;
        }
      })
      .filter((link) => link); // remove null
  },
  mentionsUser(message, user) {
    if (!user) return false;
    const regex = new RegExp(`((?:^|\\s)@?)(${user.toLowerCase()})(?=$|\\s|[?!,]|\\.(?!\\S))`, 'i');
    return regex.test(message);
  },
};
