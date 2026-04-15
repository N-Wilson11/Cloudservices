module.exports = function formatDateTime(value) {
  if (!value) {
    return 'unknown';
  }

  var date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'unknown';
  }

  var day = String(date.getDate()).padStart(2, '0');
  var month = String(date.getMonth() + 1).padStart(2, '0');
  var year = String(date.getFullYear());
  var hours = String(date.getHours()).padStart(2, '0');
  var minutes = String(date.getMinutes()).padStart(2, '0');

  return day + '-' + month + '-' + year + ' ' + hours + ':' + minutes;
};
