const google = require('googleapis').google;  // eslint-disable-line


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
    return this.getListOfUpcomingEvents(this.configuration.GOOGLE_CALENDAR_ID)
      .then(events => ({ start: events[0].start, name: events[0].summary }));
  }

  getListOfUpcomingEvents(calendarId) {
    return this.googleCal.events.list({
      calendarId,
      orderBy: 'startTime',
      singleEvents: true,
      timeMin: (new Date()).toISOString(),
    })
      .then(response => response.data.items);
  }
}

module.exports = GoogleCal;
