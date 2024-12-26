const google = require('googleapis').google; // eslint-disable-line prefer-destructuring
const moment = require('moment-timezone');

/**
 * @typedef {Object} Event
 * @property {boolean} allDay
 * @property {moment.Moment} start
 * @property {string} name
 */

/**
 * @returns {Event}
 */
function buildEvent(event) {
  // All-day events don't have a start time, only a start day.
  const allDay = !event.start.dateTime;

  const start = allDay ? moment.utc(event.start.date) : moment.utc(event.start.dateTime);

  return {
    allDay,
    start,
    name: event.summary,
  };
}

class GoogleCal {
  constructor(configuration) {
    this.configuration = configuration;
    this.scopes = ['https://www.googleapis.com/auth/calendar.readonly'];
    this.googleCal = google.calendar({
      version: 'v3',
      auth: this.configuration.GOOGLE_CALENDAR_API_KEY,
    });
  }

  findNextStreamDay() {
    return this.getListOfUpcomingEvents(this.configuration.GOOGLE_CALENDAR_ID).then(
      (googleEvents) => {
        const events = googleEvents.map(buildEvent);
        if (!events.length) {
          return null;
        }

        const nextEvent = events[0];
        if (nextEvent.allDay) {
          nextEvent.childEvent = events.find((event) => {
            return !event.allDay && event.start.isSame(nextEvent.start, 'day');
          });
        }

        return nextEvent;
      },
    );
  }

  link() {
    return this.configuration.SCHEDULE_LINK;
  }

  getListOfUpcomingEvents(calendarId) {
    return this.googleCal.events
      .list({
        calendarId,
        orderBy: 'startTime',
        singleEvents: true,
        timeMin: new Date().toISOString(),
        maxResults: 5,
        timeZone: 'UTC',
      })
      .then((response) => response.data.items);
  }
}

module.exports = GoogleCal;
