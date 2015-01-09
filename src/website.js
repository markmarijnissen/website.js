require('polyfill-function-prototype-bind');
require('mini-router/ClickInterceptor');
var Router = require('mini-router');
var smokesignals = require('smokesignals');

function Website(options){
	var self = this;
	self.options = options = options || {};
	options.router = options.router || {};
	options.router.callback = routerCallback.bind(this);

	// Setup Router
	self.router = new Router(options.router);

	// Setup Website State + Events
	smokesignals.convert(this);

	// Setup content cache
	self.content = {};

	// Add core flow
	this.addPlugin(options.core || Website.plugins.core);
	
	// Add plugins
	if(options.plugins){
		options.plugins.forEach(function(plugin){
			self.addPlugin(plugin);
		});
	}

	this.emit('created',options);
	this.getData();
}
Website.plugins = {
	core: require('./plugins/core')
};

Website.prototype.addPlugin = function(plugin){
	var self = this;
	['created',
	 'getData','gotData','gotDataForUrl',
	 'navigated',
	 'getContent','gotContent',
	 'render','rendered',
	 'dataError','navigationError','contentError']
	.forEach(function(event){
		if(typeof plugin[event] === 'function') {
			self.on(event,plugin[event]);
		}
	});
};

Website.prototype.getData = function(callback){
	var self = this;
	self.emit('getData',function gotDataCallback(err,data){
		if(!err){
			self.emit('gotData',data);
		} else {
			self.emit('dataError',err);
		}
		if(callback && callback.call){
			callback.call(self,err,data);
		}
	});
};

Website.prototype.navigate = function navigate(url){
	this.router.set(url);
};

Website.prototype.getContent = function getContent(obj,callback){
	var self = this;
	// fetch a single piece of content
	if(typeof obj !== 'object'){
		// cached
		if(self.content[obj]) {
			if(callback) callback.call(self,null,self.content[obj]);
		// not cached
		} else {
			self.emit('getContent',obj,function getContentCallback(err,content){
				if(err){
					self.emit('contentError',err);
				} else {
					self.content[obj] = content;
					self.emit('gotContent',obj);
				}
				if(callback && callback.call){
					callback.call(self,err,content);
				}
			});
		}

	// fetch multiple pieces of content
	} else {
		var keys = Object.keys(obj);
		var todo = keys.length;
		var result = {};
		var error = null;

		keys.forEach(function(key){
			self.getContent(obj[key],function(err,content){
				todo--;
				if(!err) {
					result[key] = self.content[obj[key]]; //use cached, transformed content, rather than initial retrieved content!
				} else {
					error = err;
				}
				if(todo === 0){
					callback.call(self,error,result);
				}
			});
		});
	}
};

Website.prototype.render = function(data){
	this.emit('render',data);
	this.emit('rendered',data);
	this.emit('rendered '+this.router.currentRoute,data);
};

var REFRESH_TIMEOUT = false;
Website.prototype.refresh = function(debounce){
	var self = this;
	
	if(typeof debounce === 'undefined') {
		self.emit('navigated',self.router.current.params,self.router.current.route);
	} else {
		clearTimeout(REFRESH_TIMEOUT);
		REFRESH_TIMEOUT = setTimeout(function(){
			self.emit('navigated',self.router.current.params,self.router.current.route);
		},debounce || 0);
	}
};

Website.prototype.setData = function(data){
	this.emit('gotData',data);
};

Website.prototype.setDataForUrl = function(url,data){
	this.emit('gotDataForUrl',url,data);
};

Website.prototype.setContent = function(id,content){
	this.emit('gotContent',id,content);
};

function routerCallback(params,url){
	this.emit('navigated',params,url);
}

// export as global var
window.Website = Website;
module.exports = Website;