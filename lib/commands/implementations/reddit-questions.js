const _ = require('lodash');
const Command = require('../command-interface');
const CommandOutput = require('../command-output');

function startNewThread(input, services) {
  const matched = /([1234])\s(.*)/.exec(input);
  const subTier = _.get(matched, 1);
  const title = _.get(matched, 2);
  const body = `
    This is the place for tier ${subTier} and above subs to submit questions for the upcoming podcast! 
    The most up-voted ones will be the questions prioritized. 
    If you have any questions or concerns @MrMouton on discord or in DGG chat!
    For instructions on how to submit questions, type !questions in the DGG chat!
  `;

  return services.redditVote
    .startNewThread(title, body, subTier)
    .then(maybeThreadId => {
      if (maybeThreadId === false) {
        return new CommandOutput(null, 'Thread was not created. Try again or contact Linus/Cake');
      }
      return new CommandOutput(
        null,
        `Thread created! https://www.reddit.com/r/Destiny/comments/${maybeThreadId}/ Use !questions or !dtq for instructions on submitting questions.`,
      );
    })
    .catch(err => new CommandOutput(err, "Oops. Something didn't work. Check the logs."));
}

function stopQuestionSubmissions(input, services) {
  return services.redditVote
    .stopProcess()
    .then(output => new CommandOutput(null, output))
    .catch(err => new CommandOutput(err, "Oops. Something didn't work. Check the logs."));
}

function getThreadInfo(input, services) {
  return new CommandOutput(null, services.redditVote.threadOutput());
}

module.exports = {
  startNewThread: new Command(startNewThread, true, true, /([1234])\s(.*)/),
  stopQuestionSubmissions: new Command(stopQuestionSubmissions, true, true, null),
  getThreadInfo: new Command(getThreadInfo, false, false, null),
};
