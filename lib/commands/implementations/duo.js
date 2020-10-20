const _ = require('lodash');
const Command = require('../command-interface');
const CommandOutput = require('../command-output');

/**
 * @param {string} input
 * @param {import("../../services/service-index")} services
 */
function updateDuo(input, services) {
  const matched = /(.*)/.exec(input);
  const duoText = _.get(matched, 1);

  return services.sql
    .updateDuo(duoText)
    .then(() => new CommandOutput(null, 'Duo text updated'))
    .catch((err) => new CommandOutput(err, "Oops. Something didn't work. Check the logs."));
}

/**
 * @param {string} input
 * @param {import("../../services/service-index")} services
 */
function getDuo(input, services) {
  return services.sql
    .getDuoText()
    .then((duoText) => new CommandOutput(null, duoText))
    .catch((err) => new CommandOutput(err, "Oops. Something didn't work. Check the logs."));
}

module.exports = {
  updateDuo: new Command(updateDuo, true, true, /(.*)/),
  getDuo: new Command(getDuo, true, false, null, null),
};
