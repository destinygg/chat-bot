const MockReporter = require('./mock-reporter');
const InfluxReporter = require('./influx-metrics-reporter');

let singletonReporter = new MockReporter();

function configureReporter(config, defaultTags) {
  singletonReporter = config.enabled ? new InfluxReporter(config, defaultTags) : new MockReporter();
}

function getReporter() {
  return singletonReporter;
}

module.exports = { getReporter, configureReporter };
