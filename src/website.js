var Router = require('mini-router');
require('js-object-clone');
require('polyfill-function-prototype-bind');

var defaultApi = require('./api/default');
var defaultRender = require('./render/default');

function Website(options){
	var self = this;

	self.router = new Router();
	self.data = null;  //  { sitemap: { url: ... } };
	self.sitemap = {};
	self.content = {};
	// self.api = { ... };
	// self.render(data);
	// self.navigate(url);
	// self.options = { ... }

	// Override default render function
	this.options = options || {};
	if(options.render){
		self.render = options.render.bind(self);
	}

	// Init Data API
	if(options.api) {
		self.api = options.api;
	}
	Object.keys(defaultApi).forEach(function(method){
		// use default-api when missing
		if(!self.api[method]) self.api[method] = defaultApi[method];
		// bind functions to 'self'
		self.api[method] = self.api[method].bind(self);
	});

	// Start website
	self.api.init();
	WebsiteInit.call(self);
}

Website.prototype.api = defaultApi;
Website.prototype.render = defaultRender;
Website.prototype.navigate = function(url){
	this.router.set(url);
};

function WebsiteInit(){
	var self = this;

	self.api.getData().then(function(data){
		if(typeof data !== 'object' || data === null || typeof data.sitemap !== 'object') {
			self.api.onDataError('data is invalid');
			return;
		}
		self.data = data;

		Object.keys(data.sitemap).forEach(function(_url){
			// save normalized sitemap entry
			var url = self.router.normalize(_url);
			self.sitemap[url] = data.sitemap[_url];
			self.sitemap[url].url = url;
			// Add Route Handler
			self.router.add(url,CreateRouteCallback(self,self.sitemap[url]));
		});
		self.router.set();
	},self.api.onDataError);
}

function CreateRouteCallback(self,data){
	var content = data.content;
	data = Object.clone(data,true);
	return function RouteCallback(params){
		// console.log('RouteCallback',params);
		GetAllContent.call(self,content).then(function gotContent(content){
			// console.log('gotContent',content);
			data.params = params;
			data.content = content;
			// console.log('rendering',data);
			self.render(data);
		});
	};
}

function GetAllContent(obj){
	if(typeof obj === 'undefined' || obj === null) {
		return new Promise(function(resolve) {
			resolve(null);
		});
	}
	var self = this;
	var isString = typeof obj === 'string';
	if(isString) obj = {value:obj};
	var keys = Object.keys(obj);
	// console.log('GetAllContent, keys='+keys.join(',')+', obj='+JSON.stringify(obj));
	var promises = keys.map(function(key){
		var contentId = obj[key];
		return new Promise(function(resolve,reject){
			if(self.content[contentId]) {
				resolve(self.content[contentId]);
			} else {
				self.api.getContent(contentId).then(resolve,reject);
			}
		}).then(function(content){
			self.content[contentId] = content;
			return content;
		});
	});

	return Promise.all(promises)
		.then(function(values){
			var result = {};
			keys.forEach(function(key,i){
				result[key] = values[i];
			});
			return isString? result.value: result;
		});
}

// export as global var
window.Website = Website;
module.exports = Website;