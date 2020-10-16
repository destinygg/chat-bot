const { DefaultSender, InfluxMetricReporter } = require('inspector-influx');
const { MetricRegistry, MILLISECOND } = require('inspector-metrics');
const { METRIC_NAMES } = require('./metric-names');

class InfluxReporter {
  constructor(config, tags) {
    const dbConfig = {
      username: config.username,
      password: config.password,
      database: config.database,
      port: config.port,
      host: config.host,
      protocol: config.protocol,
      precision: 'm',
    };

    // So uh. This library doesn't support path-prefixes.
    // So let's just monkey patch that in.
    const sender = new DefaultSender(dbConfig);

    // eslint-disable-next-line no-underscore-dangle
    const oldDiscard = sender.db._pool.discard;
    // eslint-disable-next-line no-underscore-dangle
    const oldText = sender.db._pool.text;

    // eslint-disable-next-line no-underscore-dangle
    sender.db._pool.text = function internal(props) {
      // eslint-disable-next-line no-param-reassign
      props.path = config.pathPrefix + props.path;
      // eslint-disable-next-line prefer-rest-params
      return oldText.apply(this, arguments);
    };

    // eslint-disable-next-line no-underscore-dangle
    sender.db._pool.discard = function internal(props) {
      // eslint-disable-next-line no-param-reassign
      props.path = config.pathPrefix + props.path;
      // eslint-disable-next-line prefer-rest-params
      return oldDiscard.apply(this, arguments);
    };

    this.reporter = new InfluxMetricReporter({
      sender,
      tags,
      unit: MILLISECOND,
      reportInterval: 30000,
      log: {
        info: () => {},
        trace: () => {},
        debug: () => {},
        warn: () => {},
        error: () => {},
      },
    });

    this.metrics = {};
    this.registry = new MetricRegistry();
    this.metrics[METRIC_NAMES.MUTES_GIVEN] = this.registry.newCounter('punishment');
    this.metrics[METRIC_NAMES.MUTES_GIVEN].setTag('punish_type', 'mute');
    this.metrics[METRIC_NAMES.BANS_GIVEN] = this.registry.newCounter('punishment');
    this.metrics[METRIC_NAMES.BANS_GIVEN].setTag('punish_type', 'ban');
    this.metrics[METRIC_NAMES.MESSAGE_RATE] = this.registry.newCounter(METRIC_NAMES.MESSAGE_RATE);
    this.metrics[METRIC_NAMES.COMMANDS_RUN] = this.registry.newCounter(METRIC_NAMES.COMMANDS_RUN);
    this.reporter.addMetricRegistry(this.registry);

    this.reporter
      .start()
      .then()
      // eslint-disable-next-line no-console
      .catch((err) => console.error(err));
  }

  incrementCounter(metricName, value) {
    this.metrics[metricName].increment(value);
  }

  markMeter(metricName, value) {
    this.metrics[metricName].mark(value);
  }
}

module.exports = InfluxReporter;
