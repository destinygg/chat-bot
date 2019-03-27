const _ = require('lodash');
const Command = require('../command-interface');
const CommandOutput = require('../command-output');

function incrementDeaths(input, services) {
  return services.sql.incrementDeaths(15)
    .then(() => services.sql.getDeaths())
    .then(deaths => new CommandOutput(null, `Incremented! New Death Total: ${deaths}`))
    .catch(err => new CommandOutput(err, "Oops. Something didn't work. Check the logs."));
}

function getDeaths(input, services) {
  return services.sql.getDeaths()
    .then(deaths => new CommandOutput(null, `Death Total: ${deaths}`))
    .catch(err => new CommandOutput(err, "Oops. Something didn't work. Check the logs."));
}

function setDeaths(input, services) {
  const matched = /(\d+)/.exec(input);
  const deathsToSet = _.get(matched, 1);
  return services.sql.setDeaths(deathsToSet)
    .then(() => services.sql.getDeaths())
    .then(deaths => new CommandOutput(null, `Deaths set! New Death Total: ${deaths}`))
    .catch(err => new CommandOutput(err, "Oops. Something didn't work. Check the logs."));
}

module.exports = {
  incrementDeaths: new Command(incrementDeaths, true, true, null),
  setDeaths: new Command(setDeaths, true, true, /(\d+)/),
  getDeaths: new Command(getDeaths, true, false, null, null),
};
