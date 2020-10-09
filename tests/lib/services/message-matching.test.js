const { hasLink, mentionsUser } = require('../../../lib/services/message-matching');
const assert = require('assert');

describe('Message matching tests ', () => {
  describe('hasLink matches link-containing messages', function() {
    const goodLinkMessages = [
      'http://mrlinux.com',
      'http://test.tv',
      'https://mrrlinux.dev',
      'ftp://mrlinux.dev',
      'ttt https://mrlinux.dev',
      'ttt https://www.MrLinux.dev/memes',
      'ttt https://wwwwmrlinux.dev/memes wow epic',
      'https://mrlinux.dev:80/memes/?query="escaped"',
      'http://localhost',
      'http://localhost:80',
      'http://localhost:4000',
      'http://memes',
      'test.tv',
      '.test.tv',
      ' testing -- test.tv .test.tv .test.com test.com test..com ...test.com test....test.com test,,,test.com  ,test.com, ',
      '.test.com.',
      '...test.com',
      'test,,,test.com',
      'cool://mrlinux.dev',
      'site:https://mrlinux.dev',
      'https://nice.',
    ];
    goodLinkMessages.forEach((msg, i) => {
      it(`hasLink matches link-containing message #${i + 1}`, () => {
        assert.deepStrictEqual(hasLink(msg), true, msg);
      });
    });
  });
  describe('hasLink does not match non-link-containing messages', function() {
    const badLinkMessages = ['random message in chat.', 'https://.....', 'yeah localhost', 'test.'];
    badLinkMessages.forEach((msg, i) => {
      it(`hasLink does not match non-link-containing message #${i + 1}`, () =>
        assert.deepStrictEqual(hasLink(msg), false, msg));
    });
  });

  describe('mentionUser matches actual mentions of a user', function() {
    it('matches #1', () => assert.deepStrictEqual(mentionsUser('Destiny hi', 'desTiny'), true));
    it('matches #2', () => assert.deepStrictEqual(mentionsUser('DesTiny hi', 'desTiny'), true));
    it('matches #3', () =>
      assert.deepStrictEqual(mentionsUser('destiny hi destiny destiny', 'DESTINY'), true));
    it('matches #5', () => assert.deepStrictEqual(mentionsUser('destiny, yo gg', 'destiny'), true));
    it('matches #6', () => assert.deepStrictEqual(mentionsUser('destiny?', 'destiny'), true));
    it('matches #7', () => assert.deepStrictEqual(mentionsUser('destiny!', 'destiny'), true));
    it('matches #8', () =>
      assert.deepStrictEqual(mentionsUser('https://destiny!', 'destiny'), false));
    it('matches #9', () => assert.deepStrictEqual(mentionsUser('destiny.gg', 'destiny'), false));
    it('matches #10', () => assert.deepStrictEqual(mentionsUser('yodestiny.gg', 'destiny'), false));
    it('matches #11', () => assert.deepStrictEqual(mentionsUser('yodestiny', 'destiny'), false));
  });
});
