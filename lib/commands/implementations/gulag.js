const _ = require('lodash');
const moment = require('moment');
const Command = require('../command-interface');
const CommandOutput = require('../command-output');

const simpleUserRegex = /\w+( \d+)?/;

function gulag(input, services) {
  const matched = simpleUserRegex.exec(input);
  matched.forEach(prisoner => {
    services.gulagRunner.addPrisoner(prisoner);
    services.messageRelay.sendOutputMessage(`${prisoner} has been consigned to the gulag`);
  });
  return new CommandOutput(null, null);
}

function release(input, services) {
  const matched = simpleUserRegex.exec(input);
  matched.forEach(prisoner => {
    if (services.gulagRunner.removePrisoner(prisoner)) {
      services.messageRelay.sendOutputMessage(`${prisoner} has been released from the gulag`);
    }
  });
  return new CommandOutput(null, null);
}

function purge(input, services, parsedMessage) {
  const matched = simpleUserRegex.exec(input);
  const dissidentWord = _.get(matched, 1, '');
  const now = moment().unix();
  const messageList = services.chatCache.runningMessageList.filter(userPost => {
    const timestamp = _.get(userPost, 'timeStamp', false);
    if (timestamp === false) {
      return false;
    }
    return now - timestamp <= 120;
  });
  const potentialDissidents = services.spamDetection.getUsersWithMatchedMessage(
    dissidentWord,
    messageList,
  );
  const indexOfUser = potentialDissidents.indexOf(parsedMessage.user);
  if (indexOfUser !== -1) {
    potentialDissidents.splice(indexOfUser, 1);
  }
  potentialDissidents.forEach(dissident => {
    this.services.gulagRunner.addPrisoner(dissident);
    services.messageRelay.sendOutputMessage(`${dissident} has been consigned to the gulag`);
  });
  return new CommandOutput(null, `Purging ${potentialDissidents.length} political opponents`);
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
  const matched = simpleUserRegex.exec(input);
  const target = _.get(matched, 1, '');
  const resultCode = services.gulagRunner.throwStone(parsedMessage.user, target);
  let message = null;
  if (resultCode === 1) {
    message = `${parsedMessage.user} hit ${target} with a stone and knocked out their answer`;
  } else if (resultCode === 0) {
    message = `${parsedMessage.user} threw a stone at ${target} and missed`;
  }
  return new CommandOutput(null, message);
}

module.exports = {
  gulag: new Command(gulag, false, true, /\w+( \d+)?/, null),
  release: new Command(release, false, true, /\w+( \d+)?/, null),
  purge: new Command(purge, false, true, /(.*)/, false),
  revolution: new Command(revolution, false, true, /(.*)/, null),
  answer: new Command(answer, false, false, /(.*)/, null),
  stone: new Command(stone, false, false, /(.*)/, null),
};
