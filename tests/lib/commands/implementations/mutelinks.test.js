const { mutelinks } = require('../../../../lib/commands/implementations/mutelinks');
const CommandOutput = require('../../../../lib/commands/command-output');
const assert = require('assert');
const sinon = require('sinon');
const Command = require('../../../../lib/commands/command-interface');
const MessageRelay = require('../../../../lib/services/message-relay');
const messageMatching = require('../../../../lib/services/message-matching');
const { makeMute } = require('../../../../lib/chat-utils/punishment-helpers');

describe('Mutelinks Test', () => {
  beforeEach(function () {
    this.mockServices = {
      messageRelay: new MessageRelay(),
      messageMatching,
      punishmentStream: {
        write: sinon.spy(),
      },
      logger: {
        info: () => {},
        warn: () => {},
        error: () => {},
      },
    };
    this.mutelinks = mutelinks(60, []);
  });

  it('mutes link messages when "all" with default time, then turned off', function () {
    const messageRelay = this.mockServices.messageRelay;
    const punishmentStream = this.mockServices.punishmentStream;

    const output1 = this.mutelinks.work('all', this.mockServices);
    assert.deepStrictEqual(
      output1,
      new CommandOutput(null, 'Link muting (1m) turned on for all links'),
    );

    messageRelay.relayMessageToListeners('msg', {
      message: 'hey whats up.',
      user: 'test1',
    });
    messageRelay.relayMessageToListeners('msg', {
      message: 'hey cool linkerino .youtube.com',
      user: 'test2',
    });
    messageRelay.relayMessageToListeners('msg', {
      message: 'hey this is my second message with a link https://twitch.tv',
      user: 'test1',
    });

    const output2 = this.mutelinks.work('off', this.mockServices);
    assert.deepStrictEqual(output2, new CommandOutput(null, 'Link muting turned off'));

    messageRelay.relayMessageToListeners('msg', {
      message: 'cool link http://twitter.com/widinwithbiden',
      user: 'test3',
    });
    assert.deepStrictEqual(punishmentStream.write.callCount, 2);
    assert.deepStrictEqual(
      punishmentStream.write.getCall(0).args[0],
      makeMute('test2', 60, 'test2 muted for 1m for posting a link while link muting is on.'),
    );
    assert.deepStrictEqual(
      punishmentStream.write.getCall(1).args[0],
      makeMute('test1', 60, 'test1 muted for 1m for posting a link while link muting is on.'),
    );
  });

  it('mutes link messages when "on" with custom time, then turned off', function () {
    const messageRelay = this.mockServices.messageRelay;
    const punishmentStream = this.mockServices.punishmentStream;

    const output1 = this.mutelinks.work('on 20m', this.mockServices, { user: 'deStInY' });
    assert.deepStrictEqual(
      output1,
      new CommandOutput(null, 'Link muting (20m) turned on for mentioning deStInY'),
    );

    messageRelay.relayMessageToListeners('msg', {
      message: 'hey whats up.',
      user: 'test1',
    });
    messageRelay.relayMessageToListeners('msg', {
      message: 'hey cool linkerino .youtube.com',
      user: 'test2',
    });
    messageRelay.relayMessageToListeners('msg', {
      message: 'hey this is my second message with a link https://twitch.tv',
      user: 'test1',
    });
    messageRelay.relayMessageToListeners('msg', {
      message: 'yo Destiny what is up',
      user: 'test3',
    });
    messageRelay.relayMessageToListeners('msg', {
      message: 'DeStInY click https://twitch.tv',
      user: 'test4',
    });
    messageRelay.relayMessageToListeners('msg', {
      message: 'Destiny click reddit.com',
      user: 'test5',
    });
    messageRelay.relayMessageToListeners('msg', {
      message: 'wow i love this site destiny.gg',
      user: 'test6',
    });
    messageRelay.relayMessageToListeners('msg', {
      message: 'wow i love this site meme.com destiny.gg',
      user: 'test7',
    });
    messageRelay.relayMessageToListeners('msg', {
      message: 'wow i love this site meme.com destiny!',
      user: 'test8',
    });

    const output2 = this.mutelinks.work('off', this.mockServices);
    assert.deepStrictEqual(output2, new CommandOutput(null, 'Link muting turned off'));

    messageRelay.relayMessageToListeners('msg', {
      message: 'destiny click http://twitter.com/widinwithbiden',
      user: 'test7',
    });

    assert.deepStrictEqual(punishmentStream.write.callCount, 3);
    assert.deepStrictEqual(
      punishmentStream.write.getCall(0).args[0],
      makeMute('test4', 1200, 'test4 muted for 20m for tagging deStInY with a link.'),
    );
    assert.deepStrictEqual(
      punishmentStream.write.getCall(1).args[0],
      makeMute('test5', 1200, 'test5 muted for 20m for tagging deStInY with a link.'),
    );
    assert.deepStrictEqual(
      punishmentStream.write.getCall(2).args[0],
      makeMute('test8', 1200, 'test8 muted for 20m for tagging deStInY with a link.'),
    );
  });
  it('message formats correctly and alerts of duplicate commands', function () {
    const messageRelay = this.mockServices.messageRelay;
    const punishmentStream = this.mockServices.punishmentStream;

    const output1 = this.mutelinks.work('on', this.mockServices, { user: 'deStInY' });
    assert.deepStrictEqual(
      output1,
      new CommandOutput(null, 'Link muting (1m) turned on for mentioning deStInY'),
    );
    const output2 = this.mutelinks.work('on 1m', this.mockServices, { user: 'deStInY' });
    assert.deepStrictEqual(
      output2,
      new CommandOutput(null, 'Link muting (1m) is already on for mentioning deStInY'),
    );
    const output3 = this.mutelinks.work('on 20m', this.mockServices, { user: 'deStInY' });
    assert.deepStrictEqual(
      output3,
      new CommandOutput(null, 'Link muting (20m) turned on for mentioning deStInY'),
    );
    const output4 = this.mutelinks.work('all 20m', this.mockServices, { user: 'deStInY' });
    assert.deepStrictEqual(
      output4,
      new CommandOutput(null, 'Link muting (20m) turned on for all links'),
    );
  });

  it('mutes messages with repeated links when in repeat state', function () {
    const messageRelay = this.mockServices.messageRelay;
    const punishmentStream = this.mockServices.punishmentStream;

    // Mock the chat cache service
    this.mockServices.chatCache = {
      getRecentUrls: sinon.stub().returns(['twitch.tv/', 'youtube.com/']),
      normalizeUrl: (url) => (url.hostname + url.pathname).toLowerCase(),
    };

    const output1 = this.mutelinks.work('repeat 15m', this.mockServices);
    assert.deepStrictEqual(output1, new CommandOutput(null, 'Link muting (15m) turned repeat'));

    // First message with a new link - should not be muted
    messageRelay.relayMessageToListeners('msg', {
      message: 'check out this new site https://reddit.com',
      user: 'test1',
    });

    // Message with a repeated link - should be muted
    messageRelay.relayMessageToListeners('msg', {
      message: 'hey check this out https://twitch.tv',
      user: 'test2',
    });

    // Message with another repeated link - should be muted
    messageRelay.relayMessageToListeners('msg', {
      message: 'cool video https://youtube.com',
      user: 'test3',
    });

    // Message with a new link - should not be muted
    messageRelay.relayMessageToListeners('msg', {
      message: 'new site https://github.com',
      user: 'test4',
    });

    assert.deepStrictEqual(punishmentStream.write.callCount, 2);
    assert.deepStrictEqual(
      punishmentStream.write.getCall(0).args[0],
      makeMute('test2', 900, 'test2 muted for 15m for posting a repeated link.'),
    );
    assert.deepStrictEqual(
      punishmentStream.write.getCall(1).args[0],
      makeMute('test3', 900, 'test3 muted for 15m for posting a repeated link.'),
    );
  });

  it('does not mute trusted-flair users in "all" mode but still mutes others', function () {
    const messageRelay = this.mockServices.messageRelay;
    const punishmentStream = this.mockServices.punishmentStream;
    const trusted = mutelinks(60, ['flair4']);

    trusted.work('all', this.mockServices);

    messageRelay.relayMessageToListeners('msg', {
      message: 'check this out https://twitch.tv',
      user: 'trustedUser',
      roles: ['flair4'],
    });
    messageRelay.relayMessageToListeners('msg', {
      message: 'click https://youtube.com',
      user: 'untrustedUser',
      roles: ['flair9'],
    });
    messageRelay.relayMessageToListeners('msg', {
      message: 'no roles at all https://reddit.com',
      user: 'noRolesUser',
    });

    assert.deepStrictEqual(punishmentStream.write.callCount, 2);
    assert.deepStrictEqual(
      punishmentStream.write.getCall(0).args[0],
      makeMute(
        'untrustedUser',
        60,
        'untrustedUser muted for 1m for posting a link while link muting is on.',
      ),
    );
    assert.deepStrictEqual(
      punishmentStream.write.getCall(1).args[0],
      makeMute(
        'noRolesUser',
        60,
        'noRolesUser muted for 1m for posting a link while link muting is on.',
      ),
    );
  });

  it('does not mute trusted-flair users in "on" (mention) mode', function () {
    const messageRelay = this.mockServices.messageRelay;
    const punishmentStream = this.mockServices.punishmentStream;
    const trusted = mutelinks(60, ['flair4']);

    trusted.work('on', this.mockServices, { user: 'deStInY' });

    messageRelay.relayMessageToListeners('msg', {
      message: 'destiny click https://twitch.tv',
      user: 'trustedUser',
      roles: ['flair4'],
    });
    messageRelay.relayMessageToListeners('msg', {
      message: 'destiny click https://youtube.com',
      user: 'untrustedUser',
      roles: ['flair9'],
    });

    assert.deepStrictEqual(punishmentStream.write.callCount, 1);
    assert.deepStrictEqual(
      punishmentStream.write.getCall(0).args[0],
      makeMute('untrustedUser', 60, 'untrustedUser muted for 1m for tagging deStInY with a link.'),
    );
  });

  it('does not mute trusted-flair users in "repeat" mode', function () {
    const messageRelay = this.mockServices.messageRelay;
    const punishmentStream = this.mockServices.punishmentStream;
    this.mockServices.chatCache = {
      getRecentUrls: sinon.stub().returns(['twitch.tv/', 'youtube.com/']),
    };
    const trusted = mutelinks(60, ['flair4']);

    trusted.work('repeat 15m', this.mockServices);

    messageRelay.relayMessageToListeners('msg', {
      message: 'hey check this out https://twitch.tv',
      user: 'trustedUser',
      roles: ['flair4'],
    });
    messageRelay.relayMessageToListeners('msg', {
      message: 'cool video https://youtube.com',
      user: 'untrustedUser',
      roles: ['flair9'],
    });

    assert.deepStrictEqual(punishmentStream.write.callCount, 1);
    assert.deepStrictEqual(
      punishmentStream.write.getCall(0).args[0],
      makeMute('untrustedUser', 900, 'untrustedUser muted for 15m for posting a repeated link.'),
    );
  });

  it('uses the configured trusted flair identifier (not hardcoded to flair4)', function () {
    const messageRelay = this.mockServices.messageRelay;
    const punishmentStream = this.mockServices.punishmentStream;
    const trusted = mutelinks(60, ['flair9']);

    trusted.work('all', this.mockServices);

    messageRelay.relayMessageToListeners('msg', {
      message: 'click https://twitch.tv',
      user: 'oldTrusted',
      roles: ['flair4'],
    });
    messageRelay.relayMessageToListeners('msg', {
      message: 'click https://youtube.com',
      user: 'newTrusted',
      roles: ['flair9'],
    });

    assert.deepStrictEqual(punishmentStream.write.callCount, 1);
    assert.deepStrictEqual(
      punishmentStream.write.getCall(0).args[0],
      makeMute('oldTrusted', 60, 'oldTrusted muted for 1m for posting a link while link muting is on.'),
    );
  });

  it('mutes everyone when trusted flair list is empty (default behavior)', function () {
    const messageRelay = this.mockServices.messageRelay;
    const punishmentStream = this.mockServices.punishmentStream;

    this.mutelinks.work('all', this.mockServices);

    messageRelay.relayMessageToListeners('msg', {
      message: 'click https://twitch.tv',
      user: 'wouldBeTrusted',
      roles: ['flair4'],
    });

    assert.deepStrictEqual(punishmentStream.write.callCount, 1);
    assert.deepStrictEqual(
      punishmentStream.write.getCall(0).args[0],
      makeMute(
        'wouldBeTrusted',
        60,
        'wouldBeTrusted muted for 1m for posting a link while link muting is on.',
      ),
    );
  });

  it('accepts multiple trusted flair identifiers', function () {
    const messageRelay = this.mockServices.messageRelay;
    const punishmentStream = this.mockServices.punishmentStream;
    const trusted = mutelinks(60, ['flair4', 'flair9']);

    trusted.work('all', this.mockServices);

    messageRelay.relayMessageToListeners('msg', {
      message: 'click https://twitch.tv',
      user: 'trustedA',
      roles: ['flair4'],
    });
    messageRelay.relayMessageToListeners('msg', {
      message: 'click https://youtube.com',
      user: 'trustedB',
      roles: ['flair9'],
    });
    messageRelay.relayMessageToListeners('msg', {
      message: 'click https://reddit.com',
      user: 'untrusted',
      roles: ['flair3'],
    });

    assert.deepStrictEqual(punishmentStream.write.callCount, 1);
    assert.deepStrictEqual(
      punishmentStream.write.getCall(0).args[0],
      makeMute('untrusted', 60, 'untrusted muted for 1m for posting a link while link muting is on.'),
    );
  });
});
