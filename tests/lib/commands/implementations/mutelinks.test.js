const { mutelinks } = require('../../../../lib/commands/implementations/mutelinks');
const CommandOutput = require('../../../../lib/commands/command-output');
const assert = require('assert');
const sinon = require('sinon');
const Command = require('../../../../lib/commands/command-interface');
const MessageRelay = require('../../../../lib/services/message-relay');
const messageMatching = require('../../../../lib/services/message-matching');
const { makeMute } = require('../../../../lib/chat-utils/punishment-helpers');

describe('Mutelinks Test', () => {
  beforeEach(function() {
    this.mockServices = {
      messageRelay: new MessageRelay(),
      messageMatching,
      punishmentStream: {
        write: sinon.spy(),
      },
    };
  });

  it('mutes link messages when "all" with default time, then turned off', function() {
    const messageRelay = this.mockServices.messageRelay;
    const punishmentStream = this.mockServices.punishmentStream;

    const output1 = mutelinks.work('all', this.mockServices);
    assert.deepStrictEqual(
      output1,
      new CommandOutput(null, 'Link muting (10m) turned on for all links'),
    );

    messageRelay.relayMessageToListeners({
      message: 'hey whats up.',
      user: 'test1',
    });
    messageRelay.relayMessageToListeners({
      message: 'hey cool linkerino .youtube.com',
      user: 'test2',
    });
    messageRelay.relayMessageToListeners({
      message: 'hey this is my second message with a link https://twitch.tv',
      user: 'test1',
    });

    const output2 = mutelinks.work('off', this.mockServices);
    assert.deepStrictEqual(output2, new CommandOutput(null, 'Link muting turned off'));

    messageRelay.relayMessageToListeners({
      message: 'cool link http://twitter.com/widinwithbiden',
      user: 'test3',
    });
    assert.deepStrictEqual(punishmentStream.write.callCount, 2);
    assert.deepStrictEqual(
      punishmentStream.write.getCall(0).args[0],
      makeMute('test2', 600, 'test2 muted for 10m for posting a link while link muting is on.'),
    );
    assert.deepStrictEqual(
      punishmentStream.write.getCall(1).args[0],
      makeMute('test1', 600, 'test1 muted for 10m for posting a link while link muting is on.'),
    );
  });

  it('mutes link messages when "on" with custom time, then turned off', function() {
    const messageRelay = this.mockServices.messageRelay;
    const punishmentStream = this.mockServices.punishmentStream;

    const output1 = mutelinks.work('on 20m', this.mockServices, { user: 'deStInY' });
    assert.deepStrictEqual(
      output1,
      new CommandOutput(null, 'Link muting (20m) turned on for mentioning deStInY'),
    );

    messageRelay.relayMessageToListeners({
      message: 'hey whats up.',
      user: 'test1',
    });
    messageRelay.relayMessageToListeners({
      message: 'hey cool linkerino .youtube.com',
      user: 'test2',
    });
    messageRelay.relayMessageToListeners({
      message: 'hey this is my second message with a link https://twitch.tv',
      user: 'test1',
    });
    messageRelay.relayMessageToListeners({
      message: 'yo Destiny what is up',
      user: 'test3',
    });
    messageRelay.relayMessageToListeners({
      message: 'DeStInY click https://twitch.tv',
      user: 'test4',
    });
    messageRelay.relayMessageToListeners({
      message: 'Destiny click reddit.com',
      user: 'test5',
    });
    messageRelay.relayMessageToListeners({
      message: 'wow i love this site destiny.gg',
      user: 'test6',
    });
    messageRelay.relayMessageToListeners({
      message: 'wow i love this site meme.com destiny.gg',
      user: 'test7',
    });
    messageRelay.relayMessageToListeners({
      message: 'wow i love this site meme.com destiny!',
      user: 'test8',
    });

    const output2 = mutelinks.work('off', this.mockServices);
    assert.deepStrictEqual(output2, new CommandOutput(null, 'Link muting turned off'));

    messageRelay.relayMessageToListeners({
      message: 'destiny click http://twitter.com/widinwithbiden',
      user: 'test7',
    });

    assert.deepStrictEqual(punishmentStream.write.callCount, 3);
    assert.deepStrictEqual(
      punishmentStream.write.getCall(0).args[0],
      makeMute('test4', 1200, 'test4 muted for 20m for posting a link while link muting is on.'),
    );
    assert.deepStrictEqual(
      punishmentStream.write.getCall(1).args[0],
      makeMute('test5', 1200, 'test5 muted for 20m for posting a link while link muting is on.'),
    );
    assert.deepStrictEqual(
      punishmentStream.write.getCall(2).args[0],
      makeMute('test8', 1200, 'test8 muted for 20m for posting a link while link muting is on.'),
    );
  });
  it('message formats correctly and alerts of duplicate commands', function() {
    const messageRelay = this.mockServices.messageRelay;
    const punishmentStream = this.mockServices.punishmentStream;

    const output1 = mutelinks.work('on', this.mockServices, { user: 'deStInY' });
    assert.deepStrictEqual(
      output1,
      new CommandOutput(null, 'Link muting (10m) turned on for mentioning deStInY'),
    );
    const output2 = mutelinks.work('on 10m', this.mockServices, { user: 'deStInY' });
    assert.deepStrictEqual(
      output2,
      new CommandOutput(null, 'Link muting (10m) is already on for mentioning deStInY'),
    );
    const output3 = mutelinks.work('on 20m', this.mockServices, { user: 'deStInY' });
    assert.deepStrictEqual(
      output3,
      new CommandOutput(null, 'Link muting (20m) turned on for mentioning deStInY'),
    );
    const output4 = mutelinks.work('all 20m', this.mockServices, { user: 'deStInY' });
    assert.deepStrictEqual(
      output4,
      new CommandOutput(null, 'Link muting (20m) turned on for all links'),
    );
  });
});
