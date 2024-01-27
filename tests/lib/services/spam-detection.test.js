const assert = require('assert');
const RollingChatCache = require('../../../lib/services/dgg-rolling-chat-cache');
const SpamDetection = require('../../../lib/services/spam-detection');
const config = require('../../../lib/configuration/prod.config.json');
const logger = require('../../../lib/services/logger');
const messageMatchingService = require('../../../lib/services/message-matching');

describe('Spam detection Tests', () => {
  beforeEach(function() {
    this.mockServices = {
      logger: logger(config.logger),
      messageMatching: messageMatchingService,
    };
    this.spamDetection = new SpamDetection({}, this.mockServices);
  });

  it('detects stupid non-ascii spam', function() {
    const result = this.spamDetection.asciiSpamCheck(
      '▒▒▓ ░▓█▀▄▒▓▒▒░░░▒▒░░▀▀▀▒▒▒▒░ ▓░ ░░░▓▓▓▓▒▒▒▒▒▒▒▒░░░▒▒▒▓▓░ ░░░░░▓▓▒░░▒▒▒▒▒▒▒▒▒▒▒▓▓░ ░░░░░░▓▒▒░░░░▒▒▒▒▒▒▒▓▓░░',
    );
    assert.deepStrictEqual(result, true);
  });

  it('detects stupid ascii art spam', function() {
    const result = this.spamDetection.asciiSpamCheck(
      `@@@@@@@#!$!@4.124>!@4;.12>.;.;.12.3;..;.;.!@3>:@>:!@$:!@>$!:@$>!@$:!@$>:1515@@@@@#!$!@4.124>!@4;.12>.;.;.12.3;..;.;.!@3>:@>:!@$:!@>$!:`,
    );
    assert.deepStrictEqual(result, true);
  });

  it('Does not alert for normal sane messages', function() {
    const result = this.spamDetection.asciiSpamCheck(
      `He'llo there sir!! I'm just typing some punctuated messages here. Shouldn't be too too many!!!! I am excited though!!!!!!! AHH!!!`,
    );
    assert.deepStrictEqual(result, false);
  });

  it('does not checks lists for similar messages in the list if the string length is short.', function() {
    const chatCache = new RollingChatCache({}, this.mockServices);
    chatCache.addMessageToRunningList('linusred', 'hey nice meme man');
    chatCache.addMessageToRunningList('jimbo', 'hey');

    const result = this.spamDetection.checkListOfMessagesForSpam(
      'hey nice meme ma',
      chatCache.runningMessageList,
    );
    assert.deepStrictEqual(result, false);
  });

  it('does checks lists for similar messages in the list if the string length is long.', function() {
    const chatCache = new RollingChatCache({}, this.mockServices);
    chatCache.addMessageToRunningList(
      'linusred',
      'hey nice meme man hey nice meme man hey nice meme man hey nice meme man hey nice meme man hey nice meme man hey nice meme man hey nice meme man hey nice meme man hey nice meme man',
    );
    chatCache.addMessageToRunningList(
      'jimbo',
      'hey nice meme man hey nice meme man hey nice meme man hey nice meme man hey ni meme man hey nice meme man hey nice meme man hey nice meme man hey nice meme man hey ni meme man',
    );

    const result = this.spamDetection.checkListOfMessagesForSpam(
      'hey nice meme man hey nice meme man hey nice meme man hey nice meme man hey ni meme man hey nice meme man hey nice meme man hey nice meme man hey nice meme man hey ni meme man',
      chatCache.runningMessageList,
    );
    assert.deepStrictEqual(result, true);
  });

  it('should find a user with matched string messages and return them once', function() {
    const chatCache = new RollingChatCache({
      messsagesToKeepPerUser: 10,
      maxMessagesInList: 2,
      timeToLive: 0,
      tombStoneInterval: 0,
    }, this.mockServices);
    const expected = ['linusred'];
    chatCache.addMessageToRunningList('linusred', 'hey nice meme man');
    chatCache.addMessageToRunningList('linusred', 'lol really nice meme man');
    chatCache.addMessageToRunningList('billy', 'stupid meme');
    const result = this.spamDetection.getUsersWithMatchedMessage(
      'nice meme',
      chatCache.runningMessageList,
    );
    assert.deepStrictEqual(result, expected);
  });

  it('should find users with matched string messages regardless of caps or trailing whitespace', function() {
    const chatCache = new RollingChatCache({
      messsagesToKeepPerUser: 10,
      maxMessagesInList: 20,
      timeToLive: 0,
      tombStoneInterval: 0,
    }, this.mockServices);
    const expected = ['coopy', 'linusred'];
    chatCache.addMessageToRunningList('linusred', 'hey nice meme man');
    chatCache.addMessageToRunningList('coopy', 'hey NiCe MeME    ');
    chatCache.addMessageToRunningList('billy', 'stupid meme');
    const result = this.spamDetection.getUsersWithMatchedMessage(
      'nice meme',
      chatCache.runningMessageList,
    );
    assert.deepStrictEqual(result, expected);
  });

  it('should find users with matched regex', function() {
    const chatCache = new RollingChatCache({
      messsagesToKeepPerUser: 10,
      maxMessagesInList: 20,
      timeToLive: 0,
      tombStoneInterval: 0,
    }, this.mockServices);
    const expected = ['coopy', 'linusred'];
    chatCache.addMessageToRunningList('linusred', 'hey nice meme man');
    chatCache.addMessageToRunningList('coopy', 'hey NiCe MeME    ');
    chatCache.addMessageToRunningList('billy', 'stupid meme');
    const result = this.spamDetection.getUsersWithMatchedMessage(
      /.*nice\s+meme.*/i,
      chatCache.runningMessageList,
    );
    assert.deepStrictEqual(result, expected);
  });

  it('add phrases to the banned list and checks them', function() {
    this.spamDetection.addBannedPhrase({ text: 'cool kid NO', duration: 600, type: 'mute' });
    const isBanned = this.spamDetection.checkAgainstBannedPhrases(
      'hello im such a cool kid NO lol',
    );

    assert.deepStrictEqual(isBanned, { text: 'cool kid NO', duration: 600, type: 'mute' });
  });

  it('adds many phrases to the banned list and checks them', function() {
    this.spamDetection.addBannedPhrase({ text: '1', duration: 600, type: 'mute' });
    this.spamDetection.addBannedPhrase({ text: '2', duration: 600, type: 'mute' });
    this.spamDetection.addBannedPhrase({ text: '3', duration: 600, type: 'mute' });
    const isBanned = this.spamDetection.checkAgainstBannedPhrases('3');

    assert.deepStrictEqual(isBanned, { text: '3', duration: 600, type: 'mute' });
  });
  it('adds regex and properly matches', function() {
    this.spamDetection.addBannedPhrase({ text: '/h..lo/', duration: 600, type: 'mute' });

    const isBanned1 = this.spamDetection.checkAgainstBannedPhrases('match: h&&lo');
    assert.deepStrictEqual(isBanned1, { text: '/h..lo/', duration: 600, type: 'mute' });

    const isBanned2 = this.spamDetection.checkAgainstBannedPhrases('NOT match: h&&&lo');
    assert.deepStrictEqual(isBanned2, false);
  });
  it("doesn't match empty regex", function() {
    this.spamDetection.addBannedPhrase({ text: '//', duration: 600, type: 'mute' });
    const isBanned = this.spamDetection.checkAgainstBannedPhrases('Nothing should match, even //');

    assert.deepStrictEqual(isBanned, false);
  });
  it('matches double-escaped regex characters as regex', function() {
    this.spamDetection.addBannedPhrase({ text: '/\\d\\d\\d/', duration: 600, type: 'mute' });
    const isBanned = this.spamDetection.checkAgainstBannedPhrases('Should match: 123');

    assert.deepStrictEqual(isBanned, { text: '/\\d\\d\\d/', duration: 600, type: 'mute' });
    const isBanned2 = this.spamDetection.checkAgainstBannedPhrases('Should NOT match: 12d');
    assert.deepStrictEqual(isBanned2, false);
  });
  it('does not match regex within phrase', function() {
    this.spamDetection.addBannedPhrase({ text: 'wow/bob/wow', duration: 600, type: 'mute' });

    const isBanned = this.spamDetection.checkAgainstBannedPhrases('Should match: wow/bob/wow');
    assert.deepStrictEqual(isBanned, { text: 'wow/bob/wow', duration: 600, type: 'mute' });

    const isBanned2 = this.spamDetection.checkAgainstBannedPhrases('Should NOT match: bob');
    assert.deepStrictEqual(isBanned2, false);
  });
  it('doesnt ban if phrase doesnt match', function() {
    this.spamDetection.addBannedPhrase({ text: '1', duration: 600, type: 'mute' });
    this.spamDetection.addBannedPhrase({ text: '2', duration: 600, type: 'mute' });
    this.spamDetection.addBannedPhrase({ text: '3', duration: 600, type: 'mute' });
    const isBanned = this.spamDetection.checkAgainstBannedPhrases('5');

    assert.deepStrictEqual(isBanned, false);
  });

  it('bans unique word violations', function() {
    const result = this.spamDetection.uniqueWordsCheck(
      'KAPPA KAPPA KAPPA KAPPA KAPPA KAPPA KAPPA KAPPA KAPPA KAPPA KAPPA KAPPA KAPPA KAPPA KAPPA KAPPA KAPPA KAPPA KAPPA KAPPA',
    );
    assert.deepStrictEqual(result, true);
  });

  it('does not ban small unique word violations', function() {
    const result = this.spamDetection.uniqueWordsCheck('KAPPA KAPPA KAPPA');
    assert.deepStrictEqual(result, false);
  });

  it('bans unique word violations even if its tricky', function() {
    const result = this.spamDetection.uniqueWordsCheck(
      'KAPPA KAPPA KAPPA heh yeah right guys this will never work KAPPA KAPPA KAPPA yeah right guys KAPPA KAPPA KAPPA  KAPPA KAPPA KAPPA KAPPA KAPPA KAPPA',
    );
    assert.deepStrictEqual(result, true);
  });

  it('matches nuked phrases with content and picks the highest one', function() {
    const result = SpamDetection.isMessageNuked(
      [
        { duration: 100, phrase: 'abc' },
        { duration: 500, phrase: '123' },
      ],
      'abc123',
    );
    assert.deepStrictEqual(result, { duration: 500, isMegaNuke: false, phrase: '123' });
  });

  it('matches case insensitive nuked phrases with content and picks the highest one', function() {
    const result = SpamDetection.isMessageNuked(
      [
        { duration: 100, phrase: 'ABC' },
        { duration: 500, phrase: '123' },
      ],
      'abc',
    );
    assert.deepStrictEqual(result, { duration: 100, isMegaNuke: false, phrase: 'ABC' });
  });

  it('matches case insensitive nuked phrases with content', function() {
    const result = SpamDetection.isMessageNuked(
      [
        { duration: 100, phrase: 'ABC' },
        { duration: 500, phrase: 'AUT' },
      ],
      'AUT',
    );
    assert.deepStrictEqual(result, { duration: 500, isMegaNuke: false, phrase: 'AUT' });
  });

  it('returns 0 on finding no matches', function() {
    const result = SpamDetection.isMessageNuked(
      [
        { duration: 100, phrase: 'abc' },
        { duration: 500, phrase: '123' },
      ],
      'eeeee',
    );
    assert.deepStrictEqual(result, { duration: 0, isMegaNuke: false, phrase: '' });
  });

  it('returns 0 on an empty nuke list', function() {
    const result = SpamDetection.isMessageNuked([], 'eeeee');
    assert.deepStrictEqual(result, { duration: 0, isMegaNuke: false, phrase: '' });
  });

  it('works with regex nuke phrases', function() {
    const result = SpamDetection.isMessageNuked(
      [
        { duration: 500, phrase: /abc/ },
        { duration: 1000, phrase: '123' },
      ],
      'abc',
    );
    assert.deepStrictEqual(result, { duration: 500, isMegaNuke: false, phrase: '/abc/' });
  });

  it('mutes stupid repated things', function() {
    const result = this.spamDetection.longRepeatedPhrase(
      'Painstiny REE lol lol look at me AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHHHHHHHHHHHHHHHHHHHHHHHHH',
    );
    assert.deepStrictEqual(result, true);
  });

  it('doesnt mute less stupid things', function() {
    const result = this.spamDetection.longRepeatedPhrase(
      'this is some phrase thats really long its nice that its really long lol this is awesome lol',
    );
    assert.deepStrictEqual(result, false);
  });

  it('doesnt mute even more less stupid things', function() {
    const result = this.spamDetection.longRepeatedPhrase(
      'www.reddit.com/awdawd look at my stupid look look at tihs lin khey kaw dkaw ai',
    );
    assert.deepStrictEqual(result, false);
  });
});
