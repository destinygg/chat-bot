const bunyan = require('bunyan');

function configureLogger(config) {
  const bunyanConf = { name: 'dggChatBot' };

  if (config.logToFile) {
    bunyanConf.streams = [
      {
        level: 'info',
        stream: process.stdout, // log INFO and above to stdout
      },
      {
        level: config.level,
        path: `${__dirname}../logs/errors.logs`, // log ERROR and above to a file
      },
    ];
  }

  return bunyan.createLogger(bunyanConf);
}

module.exports = configureLogger;
