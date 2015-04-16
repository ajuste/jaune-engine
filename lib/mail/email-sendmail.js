/**
 * @file File for defining Sendmail mailer.
 * @author Alvaro Juste
 */
var
ModuleName = 'linkstern/email/email-sendmail',
ModuleCodes = {
	ToNamesLengthDifferentThanTos : '001'
};

/**
 * 
 * @param config
 * @returns
 */
function SendMailMailer(config) {
	this.config = config;
}

SendMailMailer.prototype = (function() {
	
	var
	sm = require('nodemailer').createTransport("sendmail");
	
	return {
		/**
		 * 
		 */
		send : function(opts, cb) {
			
			var
			account = this.config.accounts[opts.accountName],
			to = null,
			from = account.name + ' <' + account.account + '>';
			
			if (opts.toNames && opts.toNames.length !== 0 && opts.toNames.length !== opts.to.length) {
				throw new linkstern.error.UnhandledError({ message: 'Invalid \'toNames\'', code : ModuleName  + ModuleCodes.ToNamesLengthDifferentThanTos });
			}
			if (opts.toNames) {
				to = opts.to.select(function(toEmail, index) {
					return opts.toNames[index] ? opts.toNames[index] + ' <' + toEmail + '>' : toEmail;
				});
			}
			else {
				to = opts.to;
			}
			
			sm.sendMail({ 
				from : from, 
				to : to.join(', '), 
				subject: opts.subject, 
				html: opts.body }, 
				function(err, data) {
					cb(err, data);
				});
		}
	};	
})();

//begin:	global
jaune.common.extend(jaune, {
	mail : {
		SendMailMailer : SendMailMailer
	}
}, false);
//end:	global