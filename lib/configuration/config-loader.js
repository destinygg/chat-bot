const fs = require('fs');


function loadConfig() {
  if (fs.existsSync('/etc/dggbot/config.json')) {
    return JSON.parse(fs.readFileSync('/etc/dggbot/config.json', 'utf8'));
  }
  return JSON.parse(fs.readFileSync(`${__dirname}/config.json`, 'utf8'));
}

module.exports = loadConfig;
