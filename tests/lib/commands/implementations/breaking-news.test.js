const assert = require('assert');
const sinon = require('sinon');
const moment = require('moment');

const { breakingNews } = require('../../../../lib/commands/implementations/breaking-news');
const CommandOutput = require('../../../../lib/commands/command-output');
const config = require('../../../../lib/configuration/prod.config.json');
const MessageRelay = require('../../../../lib/services/message-relay');
const TwitterApi = require('../../../../lib/services/twitter-api');
const HTMLMetadata = require('../../../../lib/services/html-metadata');
const messageMatching = require('../../../../lib/services/message-matching');
const { makeMute } = require('../../../../lib/chat-utils/punishment-helpers');

describe('breakingNews command Test', () => {
  beforeEach(() => {
    this.mockServices = {
      messageRelay: new MessageRelay(),
      messageMatching,
      twitterApi: new TwitterApi(config.twitter),
      punishmentStream: {
        write: sinon.spy(),
      },
      htmlMetadata: new HTMLMetadata(),
    };
  });

  it('mutes link messages when "all" with default time, then turned off', (done) => {
    const messageRelay = this.mockServices.messageRelay;
    const punishmentStream = this.mockServices.punishmentStream;

    const output1 = breakingNews.work('all', this.mockServices).output;
    assert.deepStrictEqual(
      output1,
      'Breaking news mode (5m) turned on for all links',
    );
    
    const now = moment();
    this.mockServices.twitterApi.tweetsCache['1325195021339987969'] = {
      createdAt: now,
      cachedAt: now,
    };

    messageRelay.relayMessageToListeners({
      message: 'trump malding OMEGALUL https://twitter.com/realDonaldTrump/status/1325195021339987969',
      user: 'MrMouton',
    });

    messageRelay.relayMessageToListeners({
      message: 'wow this is a cool tweet https://twitter.com/GazeWithin/status/1301160632838959111',
      user: 'Jabelonske',
    });

    messageRelay.relayMessageToListeners({
      message: 'did anyone else see this???? https://www.nytimes.com/2020/11/08/us/politics/biden-victory-speech-takeaways.html',
      user: 'dotted',
    });

    const output2 = breakingNews.work('off', this.mockServices).output;
    assert.deepStrictEqual(output2, 'Breaking news mode turned off');

    messageRelay.relayMessageToListeners({
      message: 'wow this is really cool indeed https://twitter.com/GazeWithin/status/1301160632838959111',
      user: 'Dan',
    });

    // wait for links to be parsed
    setTimeout(() => {
      assert.deepStrictEqual(punishmentStream.write.callCount, 2);
      done();
    }, 1500);
  });

  it('mutes link messages when "on" with custom time, then turned off', (done) => {
    const messageRelay = this.mockServices.messageRelay;
    const punishmentStream = this.mockServices.punishmentStream;

    const output1 = breakingNews.work('on 20m', this.mockServices, { user: 'Destiny' }).output;
    assert.deepStrictEqual(
      output1,
      'Breaking news mode (20m) turned on for mentioning Destiny',
    );

    messageRelay.relayMessageToListeners({
      message: 'Destiny click https://twitter.com/realDonaldTrump/status/1325195021339987969',
      user: 'Jabelonske',
    });
    messageRelay.relayMessageToListeners({
      message: 'Destiny MALARKEY https://www.nytimes.com/2020/11/08/us/politics/biden-victory-speech-takeaways.html',
      user: 'dotted',
    });
    messageRelay.relayMessageToListeners({
      message: 'trump OMEGALUL https://twitter.com/realDonaldTrump/status/1325195021339987969',
      user: 'Dan',
    });

    const output2 = breakingNews.work('off', this.mockServices).output;
    assert.deepStrictEqual(output2, 'Breaking news mode turned off');

    messageRelay.relayMessageToListeners({
      message: 'Destiny click https://twitter.com/realDonaldTrump/status/1325195021339987969',
      user: 'MrMouton',
    });

    // wait for links to be parsed
    setTimeout(() => {
      assert.deepStrictEqual(punishmentStream.write.callCount, 2);
      done();
    }, 1500);
  });

  it('message formats correctly and alerts of duplicate commands', () => {
    const output1 = breakingNews.work('on', this.mockServices, { user: 'deStInY' }).output;
    assert.deepStrictEqual(
      output1, 'Breaking news mode (5m) turned on for mentioning deStInY',
    );
    const output2 = breakingNews.work('on 5m', this.mockServices, { user: 'deStInY' }).output;
    assert.deepStrictEqual(
      output2, 'Breaking news mode (5m) is already on for mentioning deStInY',
    );
    const output3 = breakingNews.work('on 20m', this.mockServices, { user: 'deStInY' }).output;
    assert.deepStrictEqual(
      output3, 'Breaking news mode (20m) turned on for mentioning deStInY',
    );
    const output4 = breakingNews.work('all 20m', this.mockServices).output;
    assert.deepStrictEqual(
      output4, 'Breaking news mode (20m) turned on for all links',
    );
  });
});
