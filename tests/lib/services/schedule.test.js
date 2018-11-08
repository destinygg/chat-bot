const assert = require('assert');
const sinon = require('sinon');
const proxyquire  = require('proxyquire').noCallThru();
const mockResponses = require('./mocks/google-calendar-responses.json')

describe('Schedule Tests', () => {

  const config = {
      GOOGLE_CALENDAR_API_KEY: 'TEST123',
      GOOGLE_CALENDAR_ID : 'i54j4cu9pl4270asok3mqgdrhk@group.calendar.google.com'
  };

  const pathStub = function(){
  }
  pathStub.calendar = function(config){
    return {
        events: {
            list: function(payload){
                return Promise.resolve({
                    data: mockResponses.getEventList
                })
            }
        }
    }
  }

  const scheduleProxy = proxyquire('../../../lib/services/schedule', { 'googleapis': { google: pathStub }})
  const schedule = new scheduleProxy(config);


  it('Gets a Calendars List Of Events as an Array', function () {

    return schedule.getListOfUpcomingEvents(config.GOOGLE_CALENDAR_ID)
    .then(function (response) {
        return assert.equal(Array.isArray(response), true);
    });
  });

  it('Returns a Calendars Next "Stream" event', function () {

    return schedule.findNextStreamDay()
    .then(function (response) {
        return assert.equal(response, mockResponses.getEventList.items[0].start);
    });
  });

});
