const CommandOutput = require('../command-output');

function staticCommand(staticOutput) {
  return (input, services, parsedMessage) => {
    let output = staticOutput;

    // replace {%you%} with first arg or command executor.
    if (input) {
      const args = input.split(' ');
      if (args.length > 0) {
        output = output.replace(/\{%you%\}/gi, args[0]);
      }
    } else {
      output = output.replace(/\{%you%\}/gi, parsedMessage.user);
    }

    // replace {%me%} with command executor
    output = output.replace(/\{%me%\}/gi, parsedMessage.user);

    // replace {%anyone%} with any cached user.
    const users = [...services.chatCache.getCachedUsers()];
    if (users.length > 0) {
      let anyone = /\{%anyone%\}/gi.exec(output);
      while (anyone) {
        output = output.replace(anyone, users[Math.floor(Math.random() * users.length)]);
        anyone = /\{%anyone%\}/gi.exec(output);
      }
    }

    // randomly select option from {[n, ..., n+n]}
    // can also put previous params inside e.g. {[%you%, %me%]}
    if (/\{\[(.+?)\]\}/gi.exec(output)) {
      const randomSelection = /\{\[(.+?)\]\}/gi.exec(output)[1].split(',');
      output = output.replace(
        /\{\[(.+?)\]\}/gi,
        randomSelection[Math.floor(Math.random() * randomSelection.length)],
      );
    }

    return new CommandOutput(null, output);
  };
}

module.exports = staticCommand;
