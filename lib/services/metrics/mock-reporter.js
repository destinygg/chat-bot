/* eslint-disable class-methods-use-this,no-empty-function,no-useless-constructor */

class MockReporter {
  constructor() {}

  /**
   * @param {string} metricName
   * @param {number} value
   */
  // eslint-disable-next-line no-unused-vars
  incrementCounter(metricName, value) {}

  /**
   * @param {string} metricName
   */
  // eslint-disable-next-line no-unused-vars
  markMeter(metricName, value) {}
}

module.exports = MockReporter;
