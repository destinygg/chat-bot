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
      const fitleredEvents = events.filter((event) => {
        if (event.start.date !== undefined) {
          return false;
        }

        return !(
          moment.tz(event.end.dateTime, 'YYYY-MM-DDTHH:mm:ss', this.timezone).isAfter(now) &&
          moment.tz(event.start.dateTime, 'YYYY-MM-DDTHH:mm:ss', this.timezone).isBefore(now)
        );
      });

      return { start: fitleredEvents[0].start, name: fitleredEvents[0].summary };
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
