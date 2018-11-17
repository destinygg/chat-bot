function formatDuration(duration) {
  const years = duration.years();
  const months = duration.months();
  const days = duration.days();
  const hours = duration.hours();
  const minutes = duration.minutes();
  let output;
  const formatString = (theTime, theString) => `${theTime} ${(theTime > 1 ? `${theString}s` : theString)}`;

  if (years > 0) {
    output = `${formatString(years, 'year')}`;
  } else if (months > 0) {
    output = `${formatString(months, 'month')} ${formatString(days, 'day')}`;
  } else if (days > 0) {
    output = `${formatString(days, 'day')} ${hours}h`;
  } else {
    output = hours > 0 ? `${hours}h ${minutes}m`
      : `${minutes}m`;
  }
  return output;
}

module.exports = formatDuration;
