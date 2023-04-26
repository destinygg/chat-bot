const google = require('googleapis').google; // eslint-disable-line prefer-destructuring
const moment = require('moment-timezone');

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
    return this.getListOfUpcomingEvents(this.configuration.GOOGLE_CALENDAR_ID).then((events) => {
      const nextEvent = events.find((event) => {
        if (event.start !== undefined) {
          return true;
        }
      });

      if (!nextEvent) {
        return null;
      }

      const isAllDay = !nextEvent.start.dateTime // All-day events don't have a start time, only a start day. 
      let childEvent;
      if (isAllDay) {
        events.find((event) => {
         const isSameDay = moment.tz(event.start.dateTime, 'YYYY-MM-DDTHH:mm:ss', event.start.timeZone).isSame(nextEvent.start.date, "day")
          if (isSameDay) {
            childEvent = {start: event.start.dateTime, name: event.summary}
            return true;
          }
        });
      }
     
      return {
        start: nextEvent.start.dateTime ?? nextEvent.start.date,
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
