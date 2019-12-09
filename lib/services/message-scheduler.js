const EventEmitter = require('events');
const _ = require('lodash');

class MessageSchedule extends EventEmitter {
  constructor(config) {
    super();
    this.scheduledMessages = [];
    this.messageCursor = 0;
    this.messageInterval = config.messageIntervalMillis || 900000;
  }

  startScheduledMessages() {
    setInterval(() => {
      if (this.scheduledMessages.length !== 0) {
        const command = _.get(this.scheduledMessages, `${this.messageCursor}.command`, null);
        this.incrementMessageCursor();
        if (command !== null) {
          this.emit('command', command);
        }
      }
    }, this.messageInterval);
  }

  incrementMessageCursor() {
    if (this.messageCursor + 1 >= this.scheduledMessages.length) {
      this.messageCursor = 0;
      return;
    }
    this.messageCursor += 1;
  }

  addScheduledCommand(commandKey, command) {
    this.scheduledMessages.push({ commandKey: commandKey.toLowerCase(), command });
  }

  removeScheduledCommand(commandKey) {
    const indexOfUser = _.findIndex(
      this.scheduledMessages,
      command => command.commandKey === commandKey,
    );
    if (indexOfUser === -1) {
      return false;
    }
    this.scheduledMessages.splice(indexOfUser, 1);
    return true;
  }
}

module.exports = MessageSchedule;
