const bunyan = require('bunyan');

function configureLogger(config) {
  const bunyanConf = { name: 'dggChatBot' };

  bunyanConf.streams = [
    {
      level: config.level,
      stream: process.stdout, // log INFO and above to stdout
    }
  ];
  
  return bunyan.createLogger(bunyanConf);
}

module.exports = configureLogger;
