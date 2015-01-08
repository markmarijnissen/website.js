function createLog(type){
	return function log(){
		var args = Array.prototype.slice.apply(arguments);
		args.unshift(type);
		console.log.apply(console,args);
	};
}

var LOG_ALL_EVENTS = ['created','gotData','gotDataForUrl','navigated','gotContent','render','rendered','dataError','contentError','navigationError'];

var LogPlugin = {
	created: function(options){
		var events = options.log || LOG_ALL_EVENTS;
		if(typeof events === 'string') events = events.split(',');
		events.forEach(createLog);
		if(events.indexOf('created') >= 0){
			createLog('created')(options);
		}
	}
};
if(window.Website) window.Website.plugins.log = LogPlugin;
module.exports = LogPlugin;