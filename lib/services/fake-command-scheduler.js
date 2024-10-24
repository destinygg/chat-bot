const _ = require('lodash');
const MessageScheduler = require('./message-scheduler');
const { parseCommand } = require('../chat-utils/parse-commands-from-chat');
// A way to fake messages as if they were real through the system
class FakeCommandScheduler extends MessageScheduler {
  constructor(config) {
    super(config);
    this.startScheduledMessages();
    this.user = '__TheBot__';
  }

  startScheduledMessages() {
    setTimeout(() => {
      setInterval(() => {
        if (this.scheduledMessages.length !== 0) {
          const type = _.get(this.scheduledMessages, `${this.messageCursor}.type`, null);
          if (type === 'command') {
            const command = _.get(this.scheduledMessages, `${this.messageCursor}.parsed`, null);
            this.incrementMessageCursor();
            if (command !== null) {
              this.emit('command', { command });
            }
          }

          if (type === 'output') {
            const output = _.get(this.scheduledMessages, `${this.messageCursor}.output`, null);
            this.incrementMessageCursor();
            if (output !== null) {
              this.emit('output', { output });
            }
          }
        }
      }, this.messageInterval);
    }, Math.floor(this.messageInterval / 2));
  }

  createMessage(input) {
    if (_.isEmpty(input)) {
      return false;
    }

    this.scheduledMessages.push({
      type: 'command',
      parsed: {
        parsedCommand: parseCommand(input),
        parsedMessage: {
          user: this.user,
          roles: ['protected', 'subscriber'],
          message: input,
        },
      },
    });
    return true;
  }

  createHardcodedOutput(output) {
    if (_.isEmpty(output)) {
      return false;
    }

    this.scheduledMessages.push({
      type: 'output',
      output,
    });
    return true;
  }
}

module.exports = FakeCommandScheduler;
