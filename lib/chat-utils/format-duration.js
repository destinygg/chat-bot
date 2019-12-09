function formatDuration(duration) {
  const years = duration.years();
  const months = duration.months();
  const days = duration.days();
  const hours = duration.hours();
  const minutes = duration.minutes();
  const seconds = duration.seconds();
  let output;
  const formatString = (theTime, theString) =>
    `${theTime} ${theTime > 1 ? `${theString}s` : theString}`;

  if (years > 0) {
    output = `${formatString(years, 'year')}`;
  } else if (months > 0) {
    output = `${formatString(months, 'month')} ${formatString(days, 'day')}`;
  } else if (days > 0) {
    output = `${formatString(days, 'day')} ${hours}h`;
  } else if (hours > 0) {
    output = `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    output = `${minutes}m ${seconds !== 0 ? `${seconds}s` : ''}`;
  } else {
    output = `${seconds}s`;
  }
  return output;
}

module.exports = formatDuration;
