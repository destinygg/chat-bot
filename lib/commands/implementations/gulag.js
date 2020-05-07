const _ = require('lodash');
const moment = require('moment');
const Command = require('../command-interface');
const CommandOutput = require('../command-output');

function gulag(input, services) {
  const matched = input.split(' ');
  matched.forEach(prisoner => {
    services.gulagRunner.addPrisoner(prisoner);
    services.messageRelay.sendOutputMessage(`${prisoner} has been consigned to the gulag`);
  });
  return new CommandOutput(null, null);
}

function release(input, services) {
  const matched = input.split(' ');
  matched.forEach(prisoner => {
    if (services.gulagRunner.removePrisoner(prisoner)) {
      services.messageRelay.sendOutputMessage(`${prisoner} has been released from the gulag`);
    }
  });
  return new CommandOutput(null, null);
}

function purge(input, services, parsedMessage) {
  const now = moment().unix();
  const potentialDissidentMessages = services.chatCache.runningMessageList.filter(userPost => {
    const timestamp = _.get(userPost, 'timeStamp', false);
    if (timestamp === false) {
      return false;
    }
    return now - timestamp <= 120;
  });
  const dissidents = services.spamDetection.getUsersWithMatchedMessage(
    input,
    potentialDissidentMessages,
  );
  const indexOfUser = dissidents.indexOf(parsedMessage.user);
  if (indexOfUser !== -1) {
    dissidents.splice(indexOfUser, 1);
  }
  if (dissidents.length === 0) {
    return new CommandOutput(null, 'No dissidents found using purged phrase');
  }
  dissidents.forEach(dissident => {
    this.services.gulagRunner.addPrisoner(dissident);
    services.messageRelay.sendOutputMessage(`${dissident} has been consigned to the gulag`);
  });
  return new CommandOutput(null, `Purging ${dissidents.length} political opponents`);
}

function revolution(input, services) {
  const freedPrisoners = services.gulagRunner.emptyGulag();
  freedPrisoners.forEach(prisoner => {
    services.messageRelay.sendOutputMessage(`${prisoner} has been freed from the gulag`);
  });
  return new CommandOutput(null, 'The gulag has been emptied');
}

function answer(input, services, parsedMessage) {
  if (services.gulagRunner.recordAnswer(parsedMessage.user, input)) {
    return new CommandOutput(null, `${parsedMessage.user} your answer has been recorded`);
  }
  return new CommandOutput(null, null);
}

function stone(input, services, parsedMessage) {
  const resultCode = services.gulagRunner.throwStone(parsedMessage.user, input);
  let message = null;
  if (resultCode === 1) {
    message = `${parsedMessage.user} hit ${input} with a stone and knocked out their answer`;
  } else if (resultCode === 0) {
    message = `${parsedMessage.user} threw a stone at ${input} and missed`;
  }
  return new CommandOutput(null, message);
}

module.exports = {
  gulag: new Command(gulag, false, true, /(.*)/, null),
  release: new Command(release, false, true, /(.*)/, null),
  purge: new Command(purge, false, true, /(.*)/, false),
  revolution: new Command(revolution, false, true, /(.*)/, null),
  answer: new Command(answer, false, false, /(.*)/, null),
  stone: new Command(stone, false, false, /(.*)/, null),
};
