/**
 * @file Source code for Mail Manager.
 * @author Alvaro Juste
 */

var
/**
 * The mailers that have been created.
 */
mailers = { };

function MailManager() {
	
}

MailManager.prototype = (function() {
	
	var
	environment = new jaune.env.Environment(),
	reflection = new jaune.reflection.Reflection();
	
	return {
		/**
		 * 
		 */
		createMailer : function(mailerConfigName) {
			
			if (typeof mailerConfigName !== 'string') {
				throw new Error('Invalid mailer configuration name');
			}
			var
			mailerSettings = environment.getMail(mailerConfigName);
				
			if (!mailerSettings) {
				
				mailerSettings = environment.getMail(mailerConfigName);
				
				if (!mailerSettings) {
					throw new Error('Mailer configuration not found');
				} 
				settings[mailerConfigName] = mailerSettings;
			}		
			if (!mailers[mailerConfigName]) {
				mailers[mailerConfigName] = reflection.createInstance(mailerSettings.type, [mailerSettings]); 
			}
			if (!mailers[mailerConfigName]) {
				throw new Error('Mailer constructor not found: ' + mailerSettings.type);
			}
			return mailers[mailerConfigName];
		}
	};
})();
//	begin:	global
jaune.common.extend(jaune, {
	mail : {
		MailManager : MailManager
	}
}, false);
//	end:	global