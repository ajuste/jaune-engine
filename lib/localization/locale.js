/**
 * @file Source code for User Manager.
 * @author Alvaro Juste
 */
(function() {

  "use strict";

  const _                = require("underscore");
  const I18n             = require("i18next");
  const Environment      = require("../server/environment");
  const CountryLocations = {
    UY : { lat : -34.88987359652848, lng : -56.16416931152344 },
    Default : { lat : -34.88987359652848, lng : -56.16416931152344 }
  };
  const Keys             = {
    string : "res.key"
  };
  let LocaleSettings   = null;
  let DefaultLocale    = null;
  /**
   * @class Locale manager
   */
  var LocaleManager = function() {
    LocaleSettings   = Environment.get().getLocale();
    DefaultLocale = [
      LocaleSettings.defaultLanguage.toLowerCase(),
      LocaleSettings.defaultCountry.toUpperCase()
    ].join("-");
  };
  LocaleManager.prototype = {
    getLocaleFolderName : function(lang) {
      return this.getDefaultLanguage() === lang ? "en" : lang;
    },
    /**
     * @function Validates if a country code is supported.
     * @param {String} code Country code
     * @returns {Boolean} True if supported
     */
    isSupportedCountry : function(code) {
      return -1 !== LocaleSettings.supportedCountries.indexOf(code);
    },
    /**
     * @function Get countries codes.
     * @return {Array} Codes.
     */
    getCountries : function() {
      return LocaleSettings.supportedCountries;
    },
    /**
     * @function Get countries names.
     * @return {Array} Names.
     */
    getCountriesNames : function() {
      return this.getCountries().select(_.bind(function(code) {
        return this.getStringResource("app.countries." + code);
      }, this));
    },
    /**
     * @function Get languages names.
     * @return {Array} Names.
     */
    getLanguagesNames : function() {
      return this.getLanguages().select(_.bind(function(code) {
        return this.getStringResource("app.languages." + code.toUpperCase());
      }, this));
    },
    /**
     * @functionValidates if a language code is supported.
     * @param {String} code Language code
     * @returns {Boolean} True if supported
     */
    isSupportedLanguage : function(code) {
      return -1 !== LocaleSettings.supportedLanguages.indexOf(code);
    },
    /**
     * @function Gets default country code.
     * @return {String} Names.
     */
    getDefaultCountry : function() {
      return LocaleSettings.defaultCountry;
    },
    getLanguages : function() {
      return LocaleSettings.supportedLanguages;
    },
    getDefaultLanguage : function() {
      return LocaleSettings.defaultLanguage;
    },
    /**
     * Get string resource
     * @function
     * @param {String} key The key
     * @param {Boolean} asObject As object tree
     */
    getStringResource : function(key, asObject) {
      return I18n.t(key, { returnObjectTrees: true });
    },
    getCountryLocation : function(countryCode) {
      return CountryLocations[countryCode.toUpperCase()] || CountryLocations.Default;
    },
    translateEnum : function(enumeration) {
      var
      result = {},
      resourceKey = enumeration[Keys.string];

      for(var name in enumeration) {
        if (enumeration.hasOwnProperty(name) && "number" === typeof enumeration[name] && Keys.string !== name) {
          result[enumeration[name]] = I18n.t(resourceKey + "." + enumeration[name]);
        }
      }
      return result;
    },
    sameOrValidLanguage : function(lang) {
      return LocaleSettings.supportedLanguages.indexOf(lang) === -1 ? LocaleSettings.defaultLanguage : lang;
    },
    sameOrValidCountry : function(country) {
      return LocaleSettings.supportedCountries.indexOf(country) === -1 ? LocaleSettings.defaultCountry : country;
    },
    setLocale : function* (locale) {
      locale = this.getLocale(locale);
      return new Promise(function(resolve, reject) {
        I18n.setLng(locale.locale, { fixLng: true });
        resolve(locale);
      });
    },
    getLocale : function(language) {

      var lng = (language || I18n.lng() || DefaultLocale).split("-");

      switch(lng.length) {

        case 0 :
          lng = DefaultLocale.split("-");
        break;

        case 1 :
          lng = [this.sameOrValidLanguage(lng[0]), LocaleSettings.defaultCountry];
        break;

        default :
          lng = [this.sameOrValidLanguage(lng[0]), this.sameOrValidCountry(lng[1])];
        break;
      }
      return {
        locale : lng.join("-"),
        language : lng[0],
        country : lng[1],
        folder : I18n.detectLanguage()
      };
    }
  };
  module.exports = {
    LocaleManager : new LocaleManager()
  };
})();
