const google = require('googleapis').google; // eslint-disable-line prefer-destructuring
const moment = require('moment-timezone');

class GoogleCal {
  constructor(configuration, timezone) {
    this.configuration = configuration;
    this.timezone = timezone;
    this.scopes = ['https://www.googleapis.com/auth/calendar.readonly'];
    this.googleCal = google.calendar({
      version: 'v3',
      auth: this.configuration.GOOGLE_CALENDAR_API_KEY,
    });
  }

  findNextStreamDay() {
    return this.getListOfUpcomingEvents(this.configuration.GOOGLE_CALENDAR_ID).then((events) => {
      const now = moment.tz('UTC');
      const nextEvent = events.find((event) => {
        if (event.start.date !== undefined) {
          return true;
        }

        return !(
          moment.tz(event.end.dateTime, 'YYYY-MM-DDTHH:mm:ss', this.timezone).isAfter(now) &&
          moment.tz(event.start.dateTime, 'YYYY-MM-DDTHH:mm:ss', this.timezone).isBefore(now)
        );
      });

      return {
        start: nextEvent.start.dateTime ?? nextEvent.start.date,
        name: nextEvent.summary,
        allDay: !nextEvent.start.dateTime, // All-day events don't have a start time, only a start day.
      };
    });
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
      })
      .then((response) => response.data.items);
  }
}

module.exports = GoogleCal;
