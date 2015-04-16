/**
 * @file Source code for Date extensions.
 * @author Alvaro Juste
 */
(function() {
  "use strict";
  /**
   * Adds seconds to date.
   * @function
   * @param {Number} seconds Seconds to add.
   * @return {Date} New date
   */
  Date.prototype.addSeconds = function(seconds) {
    return new Date(this.getTime() + 1000 * seconds);
  };
  /**
   * Adds minutes to date.
   * @function
   * @param {Number} minutes Minutes to add.
   * @return {Date} New date
   */
  Date.prototype.addMinutes = function(minutes) {
    return new Date(this.getTime() + 60000 * minutes);
  };
  /**
   * Adds hours to date.
   * @function
   * @param {Number} hours Hours to add.
   * @return {Date} New date
   */
  Date.prototype.addHours = function(hours) {
    return new Date(this.getTime() + 3600000 * hours);
  };
  /**
   * Adds days to date.
   * @function
   * @param {Number} days Days to add.
   * @return {Date} New date
   */
  Date.prototype.addDays = function(days) {
    return new Date(this.getTime() + 86400000 * days);
  };
  /**
   * Calculates the difference in seconds between two dates.
   * @function
   * @param {Date} date The other date
   * @return {Number} Difference
   */
  Date.prototype.differenceInSeconds = function(date) {
    var
    diff = (this.getTime() - date.getTime()) / 1000;
    return parseInt(diff < 0 ? 0 : diff, 10).toString(10);
  };
  /**
   * Calculates the difference in hours between two dates.
   * @function
   * @param {Date} date The other date
   * @return {Number} Difference
   */
  Date.prototype.differenceInHours = function(date) {
    var
    diff = (this.getTime() - date.getTime()) / 3600000;
    return parseInt(diff < 0 ? 0 : diff, 10).toString(10);
  };
  /**
   * Removes time component from a date.
   * @function
   * @return {Date} New date
   */
  Date.prototype.removeTime = function() {
    return new Date(this.getFullYear(), this.getMonth(), this.getDate());
  };
  /**
   * Tries to get locale date string for a particular locale.
   * @function
   * @param {Date} locale The locale
   * @return {String} Representation of date
   */
  Date.prototype.tryToLocaleDateString = function(locale) {
    try {
      return this.toLocaleDateString(locale);
    }
    catch(err) {
      return this.toLocaleString();
    }
  };
  /**
   * Gets standard date format used in the application.
   * @function
   * @return {String} Representation of date
   */
  Date.prototype.toStandardDate = function() {
    return [this.getFullYear(), this.getMonth() + 1, this.getDate()].join("-");
  };
  /**
   * Parses standard representation to date.
   * @function
   * @param {String} input The input string
   * @return {Date} Date
   */
  Date.parseStandard = function(input) {
    try{
      var steps = input.split("-");
      return new Date(parseInt(steps[0], 10), parseInt(steps[1], 10) - 1, parseInt(steps[2], 10));
    }
    catch (e) {
      return new Date(-1);
    }
  };
})();
