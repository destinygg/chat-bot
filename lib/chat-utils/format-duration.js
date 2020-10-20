/**
 * @param {number} theTime
 * @param {string} theString
 */
function formatString(theTime, theString) {
  return `${theTime} ${theTime > 1 ? `${theString}s` : theString}`;
}

/**
 * @param {moment.Duration} duration
 */
function formatDuration(duration) {
  const years = duration.years();
  const months = duration.months();
  const days = duration.days();
  const hours = duration.hours();
  const minutes = duration.minutes();
  const seconds = duration.seconds();
  let output;

  if (years > 0) {
    output = `${formatString(years, 'year')}`;
  } else if (months > 0) {
    output = `${formatString(months, 'month')} ${formatString(days, 'day')}`;
  } else if (days > 0) {
    output = `${formatString(days, 'day')} ${hours}h`;
  } else if (hours > 0) {
    output = `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    output = `${minutes}m${seconds !== 0 ? ` ${seconds}s` : ''}`;
  } else {
    output = `${seconds}s`;
  }
  return output;
}

module.exports = formatDuration;
