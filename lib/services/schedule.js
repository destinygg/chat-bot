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
      const nextEvent = events.find((event) => {
        if (event.start !== undefined) {
          return true;
        }
      });
      if (!nextEvent) {
        return null;
      }
      
      const startTime = moment.tz(nextEvent.start.dateTime, 'YYYY-MM-DDTHH:mm:ss', this.timezone)
      const isAllDay = !nextEvent.start.dateTime // All-day events don't have a start time, only a start day. 
      let childEvent;
      if (isAllDay) {
        events.find((event) => {
          const startTime = moment.tz(event.start.dateTime, 'YYYY-MM-DDTHH:mm:ss', this.timezone)
          const isSameDay = startTime.isSame(moment.tz(nextEvent.start.date, this.timezone), 'day');
          if (isSameDay) {
            childEvent = {start: startTime.toISOString(true), name: event.summary}
            return true;
          }
        });
      }
     
      return {
        start: startTime.isValid() ? startTime.toISOString(true) : nextEvent.start.date,
        name: nextEvent.summary,
        allDay: isAllDay, 
        childEvent: childEvent
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
