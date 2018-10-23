const assert = require('assert');
const sinon = require('sinon');
const RollingChatCache = require('../../../lib/services/dgg-rolling-chat-cache');
const SpamDetection = require('../../../lib/services/spam-detection');


describe('Chat Cache Running List', () => {
  before(function () {
    this.spamDetection = new SpamDetection({});
  });

  it('detects stupid non-ascii spam', function () {
    const result = this.spamDetection.asciiSpamCheck('▒▒▓ ░▓█▀▄▒▓▒▒░░░▒▒░░▀▀▀▒▒▒▒░ ▓░ ░░░▓▓▓▓▒▒▒▒▒▒▒▒░░░▒▒▒▓▓░ ░░░░░▓▓▒░░▒▒▒▒▒▒▒▒▒▒▒▓▓░ ░░░░░░▓▒▒░░░░▒▒▒▒▒▒▒▓▓░░');
    assert.deepStrictEqual(result, true);
  });

  it('detects stupid ascii art spam', function () {
    const result = this.spamDetection.asciiSpamCheck(`@@@@@@@#!$!@4.124>!@4;.12>.;.;.12.3;..;.;.!@3>:@>:!@$:!@>$!:@$>!@$:!@$>:1515@@@@@#!$!@4.124>!@4;.12>.;.;.12.3;..;.;.!@3>:@>:!@$:!@>$!:`);
    assert.deepStrictEqual(result, true);
  });


  it('Does not alert for normal sane messages', function () {
    const result = this.spamDetection.asciiSpamCheck(`He'llo there sir!! I'm just typing some punctuated messages here. Shouldn't be too too many!!!! I am excited though!!!!!!! AHH!!!`);
    assert.deepStrictEqual(result, false);
  });

  it('does not checks lists for similar messages in the list if the string length is short.', function () {
    const chatCache = new RollingChatCache({});
    chatCache.addMessageToRunningList('linusred', 'hey nice meme man');
    chatCache.addMessageToRunningList('jimbo', 'hey');

    const result = this.spamDetection.checkListOfMessagesForSpam('hey nice meme ma', chatCache.runningMessageList);
    assert.deepStrictEqual(result, false);
  });

  it('does checks lists for similar messages in the list if the string length is long.', function () {
    const chatCache = new RollingChatCache({});
    chatCache.addMessageToRunningList('linusred', 'hey nice meme man hey nice meme man hey nice meme man hey nice meme man hey nice meme man hey nice meme man hey nice meme man hey nice meme man hey nice meme man hey nice meme man');
    chatCache.addMessageToRunningList('jimbo', 'hey nice meme man hey nice meme man hey nice meme man hey nice meme man hey ni meme man hey nice meme man hey nice meme man hey nice meme man hey nice meme man hey ni meme man');

    const result = this.spamDetection.checkListOfMessagesForSpam('hey nice meme man hey nice meme man hey nice meme man hey nice meme man hey ni meme man hey nice meme man hey nice meme man hey nice meme man hey nice meme man hey ni meme man', chatCache.runningMessageList);
    assert.deepStrictEqual(result, true);
  });

  it('should find a user with matched string messages and return them once', function () {
    const chatCache = new RollingChatCache({messsagesToKeepPerUser: 10, maxMessagesInList: 2, timeToLive:0, tombStoneInterval: 0});
    const expected = ['linusred'];
    chatCache.addMessageToRunningList('linusred', 'hey nice meme man');
    chatCache.addMessageToRunningList('linusred', 'lol really nice meme man');
    chatCache.addMessageToRunningList('billy', 'stupid meme')
    const result = this.spamDetection.getUsersWithMatchedMessage('nice meme', chatCache.runningMessageList);
    assert.deepStrictEqual(result, expected);
  });

  it('should find users with matched string messages regardless of caps or trailing whitespace', function () {
    const chatCache = new RollingChatCache({messsagesToKeepPerUser: 10, maxMessagesInList: 20, timeToLive:0, tombStoneInterval: 0});
    const expected = ['coopy', 'linusred'];
    chatCache.addMessageToRunningList('linusred', 'hey nice meme man');
    chatCache.addMessageToRunningList('coopy', 'hey NiCe MeME    ');
    chatCache.addMessageToRunningList('billy', 'stupid meme');
    const result = this.spamDetection.getUsersWithMatchedMessage('nice meme', chatCache.runningMessageList);;
    assert.deepStrictEqual(result, expected);
  });

  it('should find users with matched regex', function () {
    const chatCache = new RollingChatCache({messsagesToKeepPerUser: 10, maxMessagesInList: 20, timeToLive:0, tombStoneInterval: 0});
    const expected = ['coopy', 'linusred'];
    chatCache.addMessageToRunningList('linusred', 'hey nice meme man');
    chatCache.addMessageToRunningList('coopy', 'hey NiCe MeME    ');
    chatCache.addMessageToRunningList('billy', 'stupid meme')
    const result = this.spamDetection.getUsersWithMatchedMessage(/.*nice\s+meme.*/i, chatCache.runningMessageList);
    assert.deepStrictEqual(result, expected);
  });


  it('add phrases to the banned list and checks them', function () {
    this.spamDetection.addBannedPhrase({text:"cool kid NO", duration:600, type:'mute'});
    const isBanned = this.spamDetection.checkAgainstBannedPhrases("hello im such a cool kid NO lol");

    assert.deepStrictEqual(isBanned, {text:"cool kid NO", duration:600, type:'mute'});
  });

  it('adds many phrases to the banned list and checks them', function () {
    this.spamDetection.addBannedPhrase({text:"1", duration:600, type:'mute'});
    this.spamDetection.addBannedPhrase({text:"2", duration:600, type:'mute'});
    this.spamDetection.addBannedPhrase({text:"3", duration:600, type:'mute'});
    const isBanned = this.spamDetection.checkAgainstBannedPhrases('3');

    assert.deepStrictEqual(isBanned, {text:"3", duration:600, type:'mute'});
  });

  it('doesnt ban if phrase doesnt match', function () {
    this.spamDetection.addBannedPhrase({text:"1", duration:600, type:'mute'});
    this.spamDetection.addBannedPhrase({text:"2", duration:600, type:'mute'});
    this.spamDetection.addBannedPhrase({text:"3", duration:600, type:'mute'});
    const isBanned = this.spamDetection.checkAgainstBannedPhrases("5");

    assert.deepStrictEqual(isBanned, false);
  });

  it('bans unique word violations', function () {
    const result = this.spamDetection.uniqueWordsCheck('KAPPA KAPPA KAPPA KAPPA KAPPA KAPPA KAPPA KAPPA KAPPA KAPPA KAPPA KAPPA KAPPA KAPPA KAPPA KAPPA KAPPA KAPPA KAPPA KAPPA')
    assert.deepStrictEqual(result, true);
  });

  it('does not ban small unique word violations', function () {
    const result = this.spamDetection.uniqueWordsCheck('KAPPA KAPPA KAPPA')
    assert.deepStrictEqual(result, false);
  });

  it('bans unique word violations even if its tricky', function () {
    const result = this.spamDetection.uniqueWordsCheck('KAPPA KAPPA KAPPA heh yeah right guys this will never work KAPPA KAPPA KAPPA yeah right guys KAPPA KAPPA KAPPA  KAPPA KAPPA KAPPA KAPPA KAPPA KAPPA')
    assert.deepStrictEqual(result, true);
  });
});

