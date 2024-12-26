const assert = require('assert');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const moment = require('moment');
const mockResponses = require('./mocks/google-calendar-responses.json');

describe('Schedule Tests', () => {
  const config = {
    GOOGLE_CALENDAR_API_KEY: 'TEST123',
    GOOGLE_CALENDAR_ID: 'i54j4cu9pl4270asok3mqgdrhk@group.calendar.google.com',
  };

  const buildSchedule = function (responseSet = mockResponses['getEventList']) {
    const pathStub = function () {};
    pathStub.calendar = function (config) {
      return {
        events: {
          list: function (payload) {
            return Promise.resolve({
              data: responseSet,
            });
          },
        },
      };
    };

    const scheduleProxy = proxyquire('../../../lib/services/schedule', {
      googleapis: { google: pathStub },
    });
    return new scheduleProxy(config);
  };

  it('Gets a Calendars List Of Events as an Array', function () {
    return buildSchedule()
      .getListOfUpcomingEvents(config.GOOGLE_CALENDAR_ID)
      .then(function (response) {
        return assert.equal(Array.isArray(response), true);
      });
  });

  it('Returns a Calendars Next "Stream" event', function () {
    return buildSchedule()
      .findNextStreamDay()
      .then(function (response) {
        return assert.deepStrictEqual(response, {
          allDay: false,
          start: moment.utc('2018-11-12T17:00:00Z'),
          name: 'Stream',
        });
      });
  });

  it('Returns the next all-day calendar event', function () {
    return buildSchedule(mockResponses['getAllDayEventList'])
      .findNextStreamDay()
      .then(function (response) {
        return assert.deepStrictEqual(response, {
          start: moment.utc('2023-03-15'),
          name: 'Stop the Steal Debate with Ali Alexander',
          allDay: true,
          childEvent: undefined,
        });
      });
  });

  it('Returns the next all-day calendar event with an event on the day', function () {
    return buildSchedule(mockResponses['getAllDayEventWithSubEvent'])
      .findNextStreamDay()
      .then(function (response) {
        return assert.deepStrictEqual(response, {
          start: moment.utc('2023-03-15'),
          name: 'Stop the Steal Debate with Ali Alexander',
          allDay: true,
          childEvent: {
            allDay: false,
            start: moment.utc('2023-03-15T16:00:00Z'),
            name: 'Stop the Steal Ping Pong Break',
          },
        });
      });
  });

  it('Returns `null` if no events', function () {
    return buildSchedule({ items: [] })
      .findNextStreamDay()
      .then(function (response) {
        return assert.strictEqual(response, null);
      });
  });
});
