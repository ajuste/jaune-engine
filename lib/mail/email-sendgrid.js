/**
 * @file File for defining Send Grid mailer.
 * @author Alvaro Juste
 */

function SendGridMailer(config) {
	this.config = config;
}

SendGridMailer.prototype = (function() {
	
	var
	sg = require('sendgrid');
	
	return {
		/**
		 * 
		 */
		send : function(opts, cb) {
			
			var
			sender = null,
			email = null,
			to = null,
			account = this.config.accounts[opts.accountName];
			
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
			sender = new sg.SendGrid(account.user, account.password);
			email = new sg.Email({
				to : to,
				from : account.account,
				fromname : account.name,
				subject : opts.subject,
				html : opts.body
			});
			sender.send(email, function(err, data){				
				cb(err || err === false ? data : undefined);
			});
		}
	};		
})();
//	begin:	global
jaune.common.extend(jaune, {
	mail : {
		SendGridMailer : SendGridMailer
	}
}, false);
//	end:	global