const CommandOutput = require('../command-output');

function staticCommand(staticOutput) {
  return (input) => {
    let output = staticOutput;
    const args = input ? input.split(' ') : [];

    output = output.replace(/\{%(\d+)%\}/g, (_, i) => {
      if (parseInt(i, 10) && args[parseInt(i, 10) - 1]) {
        return args[parseInt(i, 10) - 1];
      }
      return '';
    });

    return new CommandOutput(null, output);
  };
}

module.exports = staticCommand;
