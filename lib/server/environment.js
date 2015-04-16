/**
 * @file Source file for environment registration.
 * @author Alvaro Juste
 */

function Environment() {
	return new process.app.configuration.environment();
}
jaune.common.extend(jaune, {
	env : {
		Environment : Environment
	}
}, false);