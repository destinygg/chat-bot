const CommandOutput = require('../command-output');

function staticCommand(staticOutput) {
  return (input, services, parsedMessage) => {
    let output = staticOutput;

    // replace {%you%} with first arg or command executor.
    output = output.replace(/\{%you%\}/gi, () => {
      if (input) {
        const args = input.split(' ');
        if (args.length > 0) {
          return args[0];
        }
      }
      return parsedMessage.user;
    });

    // replace {%me%} with command executor
    output = output.replace(/\{%me%\}/gi, parsedMessage.user);

    // replace {%anyone%} with any cached user.
    output = output.replace(/\{%anyone%\}/gi, () => services.roleCache.getRecentRandomUsername());

    // randomly select option from {[n, ..., n+n]}
    // can also put previous params inside e.g. {[%you%, %me%]}
    output = output.replace(/\{\[(.+?)\]\}/gi, (_, val) => {
      const list = val.split(',').map((v) => v.trim());
      return list[Math.floor(Math.random() * list.length)];
    });

    return new CommandOutput(null, output);
  };
}

module.exports = staticCommand;
