const assert = require('assert');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
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
          start: '2018-11-12T17:00:00-06:00',
          name: 'Stream',
          allDay: false,
          childEvent: undefined,
        });
      });
  });

  it('Returns the next all-day calendar event', function () {
    return buildSchedule(mockResponses['getAllDayEventList'])
      .findNextStreamDay()
      .then(function (response) {
        return assert.deepStrictEqual(response, {
          start: '2023-03-15',
          name: 'Stop the Steal Debate with Ali Alexander',
          allDay: true,
          childEvent: undefined,
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
