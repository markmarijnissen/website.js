require('js-object-clone');
require('polyfill-function-prototype-bind');
var Promise = require('Promise');
var Router = require('mini-router');
var smokesignals = require('smokesignals');
var defaultApi = require('./api/default');
var HTMLRenderer = require('./render/html');

function Website(options){
	var self = this;
	// add events
	smokesignals.convert(self);

	// options: object containing website options
	self.options = options = options || {};

	// router
	self.router = new Router({
		html5: options.html5,
		base: options.base,
		interceptClicks: options.interceptClicks,
		callback: routerCallback.bind(self)
	});

	self.data = null;
	// data = {
	//    sitemap: { ... }
	//    ...
	// }

	self.sitemap = {};
	// sitemap: {
	//   "/path": {
	//     title: "My Page"
	//     content: "id"   or  { "nav":"id", "main":"id" }
	//   }
	// }

	self.content = {};
	// content = { "id": ... }

	createRenderer.call(self);
	// self.render(data);

	createAPI.call(self);
	// self.api = {
	//    getData(){ ... },
	//    getContent(id){ ... }  // methods return a promise
	// };

	self.emit('created',options);


	getData.call(self);
	// data = sitemap['/path']
    // + data.content: `id` is replaced with actual content
    // + data.params: route parameters

	// self.navigate(url);  // navigate to an url
	// self.refresh();      // re-render current url
}
Website.api = {

};
Website.render = {
	html: HTMLRenderer
};

/**
 * API to get all site data, see constructor
 */
Website.prototype.api = defaultApi;

/**
 * render function to render content, see constructor
 */
Website.prototype.render = HTMLRenderer.render;

/**
 * Trigger navigation
 * @param  {string} url
 */
Website.prototype.navigate = function(url){
	this.router.set(url);
};

/**
 * Re-render the current route and page.
 */
Website.prototype.refresh = function(){
	this.router.set();
};

/**
 * Live update site content (e.g. when using Firebase)
 *
 * @param {string} id
 * @param {...} content
 */
Website.prototype.setContent = function(id,content){
	// set content
	this.content[id] = content;
	this.emit('gotContent',id,content);

	// refresh page if needed
	var data = this.sitemap[this.router.currentRoute];
	if(data && data.content &&
		(data.content === id || data.content[id]))
	{
		this.refresh();
	}
};

/**
 * Live update sitemap page metadata (e.g. when using Firebase)
 *
 * @param {string} url
 * @param {Object} data
 */
Website.prototype.setDataForUrl = function(url,data){
	// set content
	url = this.router.normalize(url);
	this.sitemap[url] = data;
	this.emit('gotDataForUrl',url,data);

	// refresh page if needed
	if(this.router.currentRoute === url) this.refresh();
};

//////////////////////////////////
// Private Methods

// Add event listeners to an API or RENDERER
function addEventListeners(self,eventCallbacks){
	['created','gotData','navigated',
	 'before render','rendered',
	 'gotContent','gotDataForUrl']
	.forEach(function(event){
		if(eventCallbacks[event]) {
			self.on(event,eventCallbacks[event]);
		}
	});
}

function emitDataError(err){
	this.emit('dataError',err);
}

function emitContentError(err){
	this.emit('contentError',err);
}

function emitNavigationError(err){
	this.emit('navigationError',err);
}

/**
 * createAPI()
 *
 * - bind methods to the website instance
 * - use default API methods when missing
 * - add event listeners
 */
function createAPI(){
	var self = this;
	if(self.options.api) {
		self.api = self.options.api;
	}
	['getData','getContent'].forEach(function(method){
		// use default-api when missing
		if(!self.api[method]) {
			self.api[method] = defaultApi[method];
		}
		// bind functions to 'self'
		self.api[method] = self.api[method].bind(self);
	});
	addEventListeners(self,self.api);
}

/**
 * createRenderer()
 *
 * options.render is a render function or object
 *
 * object in the form of
 *
 * {
 *    event: callback
 *    render: renderFunction
 * }
 */
function createRenderer(){
	if(typeof this.options.render === 'object') {
		addEventListeners(this,this.options.render);
		this.render = this.options.render.render.bind(this);
	}
}

/**
 * private method: getData
 *
 * uses api.getData() to
 * - fetch data,
 * - update sitemap
 * - trigger router
 */
function getData(){
	var self = this;
	self.api.getData()
		.then(function(data){
			// validate data
			if(typeof data !== 'object' || data === null || typeof data.sitemap !== 'object') {
				self.api.onDataError('data is invalid');
				return;
			}
			// set data
			self.data = data;

			// create sitemap (with normalized urls) and add routes
			Object.keys(data.sitemap).forEach(function(_url){
				// save normalized sitemap entry
				var url = self.router.normalize(_url);
				self.sitemap[url] = data.sitemap[_url];
				self.sitemap[url].url = url;
				self.emit('gotDataForUrl',url,self.sitemap[url]);
				// Add Route Handler
				self.router.add(url);
			});

			// trigger event and navigate to current location!
			self.emit('gotData',data);
			self.refresh();
		},emitDataError.bind(self));
}

/**
 * on navigation
 *
 * @param  {object} params object with route parameters
 * @param  {string} url    original route url
 */
function routerCallback(params,url){
	var self = this;
	var data = self.sitemap[url];
	if(data){
		data.params = params;
		this.emit('navigated',data);

		data = Object.clone(data,true);
		getAllContent.call(this,data.content)
			.then(function gotContent(content){
				data.content = content;
				self.emit('before render',data);
				self.render(data);
				self.emit('rendered',data);
				self.emit('rendered '+url,data);
			},emitContentError.bind(self));
	} else {
		emitNavigationError.call(this,'not_found');
	}
}

/**
 * getAllContent(obj)
 *
 * takes a string with contentId
 * or an object with mapping {"name":"contentId"}
 * and fetches all content using api.getContent(id)
 *
 * when all content is fetched, returns the original
 * object with the actual content.
 *
 * @param  {object|string} content string or object
 * @return {Promise}
 */
function getAllContent(obj){
	if(typeof obj === 'undefined' || obj === null) {
		return new Promise(function(resolve) {
			resolve(null);
		});
	}
	var self = this;
	var isString = typeof obj === 'string';
	if(isString) obj = {value:obj};
	var keys = Object.keys(obj);
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
			self.emit('gotContent',contentId,content);
			return contentId;
		});
	});

	return Promise.all(promises)
		.then(function(ids){
			var result = {};
			keys.forEach(function(key,i){
				result[key] = self.content[ids[i]];
			});
			return isString? result.value: result;
		});
}

// export as global var
window.Website = Website;
module.exports = Website;