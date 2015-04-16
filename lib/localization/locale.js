/**
 * @file Source code for User Manager.
 * @author Alvaro Juste
 */
(function() {
	
	"user strict";
	
	var
	modules = {
		i18n : require("i18next"),
		env : new jaune.env.Environment()
	},
	settings = {
		locale : modules.env.getLocale()
	},
	keys = {
		string : "res.key"
	};

	/**
	 * Create a new instance of Locale manager.
	 * 
	 * @constructor
	 */
	function LocaleManager() {
	}
	/**
	 * Module prototype
	 */
	LocaleManager.prototype = (function() {
		
		var
		countryLocations = {
			UY : { lat : -34.88987359652848, lng : -56.16416931152344 },
			Default : { lat : -34.88987359652848, lng : -56.16416931152344 }
		},
		defaultLocale = settings.locale.defaultLanguage.toLowerCase() + "-" + settings.locale.defaultCountry.toUpperCase();

		return {
			getLocaleFolderName : function(lang) {
				return this.getDefaultLanguage() === lang ? "en" : lang; 
			},
			/**
			 * Validates if a country code is supported.
			 * @function
			 * @param {String} code Country code
			 * @returns {Boolean} True if supported
			 */
			isSupportedCountry : function(code) {
				return -1 !== settings.locale.supportedCountries.indexOf(code);
			},
			/**
			 * Get countries codes.
			 * @function
			 * @return {Array} Codes.
			 */
			getCountries : function() {
				return settings.locale.supportedCountries;
			},
			/**
			 * Get countries names.
			 * @function
			 * @return {Array} Names.
			 */
			getCountriesNames : function() {
				return this.getCountries().select(jaune.common.bind(function(code) {
					return this.getStringResource("app.countries." + code);
				}, this));
			},
			/**
			 * Get languages names.
			 * @function
			 * @return {Array} Names.
			 */
			getLanguagesNames : function() {
				return this.getLanguages().select(jaune.common.bind(function(code) {
					return this.getStringResource("app.languages." + code.toUpperCase());
				}, this));
			},
			/**
			 * Validates if a language code is supported.
			 * @function
			 * @param {String} code Language code
			 * @returns {Boolean} True if supported
			 */
			isSupportedLanguage : function(code) {
				return -1 !== settings.locale.supportedLanguages.indexOf(code);
			},
			/**
			 * Gets default country code.
			 * @function
			 * @return {String} Names.
			 */
			getDefaultCountry : function() {
				return settings.locale.defaultCountry;
			},
			getLanguages : function() {
				return settings.locale.supportedLanguages;
			},
			getDefaultLanguage : function() {
				return settings.locale.defaultLanguage;
			},
			/**
			 * Get string resource
			 * @function
			 * @param {String} key The key
			 * @param {Boolean} asObject As object tree
			 */
			getStringResource : function(key, asObject) {
				return modules.i18n.t(key, { returnObjectTrees: true });
			},
			getCountryLocation : function(countryCode) {
				return countryLocations[countryCode.toUpperCase()] || countryLocations.Default;
			},
			translateEnum : function(enumeration) {
				var
				result = {},
				resourceKey = enumeration[keys.string];
				
				for(var name in enumeration) {
					if (enumeration.hasOwnProperty(name) && "number" === typeof enumeration[name] && keys.string !== name) {
						result[enumeration[name]] = modules.i18n.t(resourceKey + "." + enumeration[name]);
					}
				}
				return result;
			},
			sameOrValidLanguage : function(lang) {
				return settings.locale.supportedLanguages.indexOf(lang) === -1 ? settings.locale.defaultLanguage : lang;
			},
			sameOrValidCountry : function(country) {
				return settings.locale.supportedCountries.indexOf(country) === -1 ? settings.locale.defaultCountry : country;
			},
			setLocale : function(locale, cb) {
				modules.i18n.setLng(locale.locale, { fixLng: true }, function() {
					cb(locale);
				});
			},
			getLocale : function(language) {
				
				var lng = (language || modules.i18n.lng() || defaultLocale).split("-");
				
				switch(lng.length) {
					
					case 0 :
						lng = defaultLocale.split("-");
					break;
					
					case 1 : 
						lng = [this.sameOrValidLanguage(lng[0]), settings.locale.defaultCountry];
					break;
						
					default : 
						lng = [this.sameOrValidLanguage(lng[0]), this.sameOrValidCountry(lng[1])];
					break;
				}
				return {
					locale : lng.join("-"),
					language : lng[0],
					country : lng[1],
					folder : modules.i18n.detectLanguage()
				};
			}
		};
	})();

	//begin:	global
	jaune.common.extend(jaune, {
		app : {
			locale : {
				LocaleManager : LocaleManager
			}
		}
	}, false);
	//end:	global
})();