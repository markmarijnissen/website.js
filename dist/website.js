/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	window.setImmediate = setTimeout;
	__webpack_require__(6);
	__webpack_require__(5);
	var Promise = __webpack_require__(7);
	var Router = __webpack_require__(8);
	var smokesignals = __webpack_require__(4);
	var defaultApi = __webpack_require__(1);
	var HTMLRenderer = __webpack_require__(2);

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

	function contentHasId(obj,val){
		if(obj === val) return true;
		if(typeof obj !== 'object') return false;
		for(var key in obj){
			if(obj[key] === val) return true;
		}
		return false;
	}

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
		if(data && data.content && contentHasId(data.content,id))
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

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var API = {
		getData: function(){
			throw new Error('API.getData() not implemented!');
			// Should return a Promise with all 'data'
		},
		getContent: function(id){
			throw new Error('API.getContent(id) not implemented!');
			// Show return a Promise which returns the HTML
		}
	};
	module.exports = API;

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	var getElement = __webpack_require__(3);

	var HTMLRenderer = {
		render: function render(data) {
			if(data.title)	{
				document.title = data.title;
			}
			if(typeof data.content === 'string'){
				document.body.innerHTML = data.content;
			} else if(typeof data.content === 'object'){
				var keys = Object.keys(data.content);
				var layoutIndex = keys.indexOf('layout');
				if(layoutIndex >= 0){
					keys.splice(layoutIndex,1);
					keys.unshift('layout');
				}
				keys.map(function(id){
						var el = getElement(id);
						if(el) el.innerHTML = data.content[id];
					});
			}
		}
	};

	if(window.Website) window.Website.render.html = HTMLRenderer;
	module.exports = HTMLRenderer;

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	var elCache = {};
	module.exports = function(id){
		if(elCache[id]) return elCache[id];
		return document.getElementById(id);
	};

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {var existed = false;
	var old;

	if ('smokesignals' in global) {
	    existed = true;
	    old = global.smokesignals;
	}

	__webpack_require__(10);

	module.exports = smokesignals;

	if (existed) {
	    global.smokesignals = old;
	}
	else {
	    delete global.smokesignals;
	}
	
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	// Taken from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
	if (!Function.prototype.bind) {
	  Function.prototype.bind = function (oThis) {
	    if (typeof this !== "function") {
	      // closest thing possible to the ECMAScript 5
	      // internal IsCallable function
	      throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
	    }

	    var aArgs = Array.prototype.slice.call(arguments, 1), 
	        fToBind = this, 
	        fNOP = function () {},
	        fBound = function () {
	          return fToBind.apply(this instanceof fNOP && oThis
	                 ? this
	                 : oThis,
	                 aArgs.concat(Array.prototype.slice.call(arguments)));
	        };

	    fNOP.prototype = this.prototype;
	    fBound.prototype = new fNOP();

	    return fBound;
	  };
	}


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	/*
	 * $Id: object-clone.js,v 0.41 2013/03/27 18:29:04 dankogai Exp dankogai $
	 *
	 *  Licensed under the MIT license.
	 *  http://www.opensource.org/licenses/mit-license.php
	 *
	 */

	(function(global) {
	    'use strict';
	    if (!Object.freeze || typeof Object.freeze !== 'function') {
	        throw Error('ES5 support required');
	    }
	    // from ES5
	    var O = Object, OP = O.prototype,
	    create = O.create,
	    defineProperty = O.defineProperty,
	    defineProperties = O.defineProperties,
	    getOwnPropertyNames = O.getOwnPropertyNames,
	    getOwnPropertyDescriptor = O.getOwnPropertyDescriptor,
	    getPrototypeOf = O.getPrototypeOf,
	    freeze = O.freeze,
	    isFrozen = O.isFrozen,
	    isSealed = O.isSealed,
	    seal = O.seal,
	    isExtensible = O.isExtensible,
	    preventExtensions = O.preventExtensions,
	    hasOwnProperty = OP.hasOwnProperty,
	    toString = OP.toString,
	    isArray = Array.isArray,
	    slice = Array.prototype.slice;
	    // Utility functions; some exported
	    function defaults(dst, src) {
	        getOwnPropertyNames(src).forEach(function(k) {
	            if (!hasOwnProperty.call(dst, k)) defineProperty(
	                dst, k, getOwnPropertyDescriptor(src, k)
	            );
	        });
	        return dst;
	    };
	    var isObject = function(o) { return o === Object(o) };
	    var isPrimitive = function(o) { return o !== Object(o) };
	    var isFunction = function(f) { return typeof(f) === 'function' };
	    var signatureOf = function(o) { return toString.call(o) };
	    var HASWEAKMAP = (function() { // paranoia check
	        try {
	            var wm = WeakMap();
	            wm.set(wm, wm);
	            return wm.get(wm) === wm;
	        } catch(e) {
	            return false;
	        }
	    })();
	    // exported
	    function is (x, y) {
	        return x === y
	            ? x !== 0 ? true
	            : (1 / x === 1 / y) // +-0
	        : (x !== x && y !== y); // NaN
	    };
	    function isnt (x, y) { return !is(x, y) };
	    var defaultCK = {
	        descriptors:true,
	        extensibility:true, 
	        enumerator:getOwnPropertyNames
	    };
	    function equals (x, y, ck) {
	        var vx, vy;
	        if (HASWEAKMAP) {
	            vx = WeakMap();
	            vy = WeakMap();
	        }
	        ck = defaults(ck || {}, defaultCK);
	        return (function _equals(x, y) {
	            if (isPrimitive(x)) return is(x, y);
	            if (isFunction(x))  return is(x, y);
	            // check deeply
	            var sx = signatureOf(x), sy = signatureOf(y);
	            var i, l, px, py, sx, sy, kx, ky, dx, dy, dk, flt;
	            if (sx !== sy) return false;
	            switch (sx) {
	            case '[object Array]':
	            case '[object Object]':
	                if (ck.extensibility) {
	                    if (isExtensible(x) !== isExtensible(y)) return false;
	                    if (isSealed(x) !== isSealed(y)) return false;
	                    if (isFrozen(x) !== isFrozen(y)) return false;
	                }
	                if (vx) {
	                    if (vx.has(x)) {
	                        // console.log('circular ref found');
	                        return vy.has(y);
	                    }
	                    vx.set(x, true);
	                    vy.set(y, true);
	                }
	                px = ck.enumerator(x);
	                py = ck.enumerator(y);
	                if (ck.filter) {
	                    flt = function(k) {
	                        var d = getOwnPropertyDescriptor(this, k);
	                        return ck.filter(d, k, this);
	                    };
	                    px = px.filter(flt, x);
	                    py = py.filter(flt, y);
	                }
	                if (px.length != py.length) return false;
	                px.sort(); py.sort();
	                for (i = 0, l = px.length; i < l; ++i) {
	                    kx = px[i];
	                    ky = py[i];
	                    if (kx !== ky) return false;
	                    dx = getOwnPropertyDescriptor(x, ky);
	                    dy = getOwnPropertyDescriptor(y, ky);
	                    if ('value' in dx) {
	                        if (!_equals(dx.value, dy.value)) return false;
	                    } else {
	                        if (dx.get && dx.get !== dy.get) return false;
	                        if (dx.set && dx.set !== dy.set) return false;
	                    }
	                    if (ck.descriptors) {
	                        if (dx.enumerable !== dy.enumerable) return false;
	                        if (ck.extensibility) {
	                            if (dx.writable !== dy.writable)
	                                return false;
	                            if (dx.configurable !== dy.configurable)
	                                return false;
	                        }
	                    }
	                }
	                return true;
	            case '[object RegExp]':
	            case '[object Date]':
	            case '[object String]':
	            case '[object Number]':
	            case '[object Boolean]':
	                return ''+x === ''+y;
	            default:
	                throw TypeError(sx + ' not supported');
	            }
	        })(x, y);
	    }
	    function clone(src, deep, ck) {
	        var wm;
	        if (deep && HASWEAKMAP) {
	            wm = WeakMap();
	        }
	        ck = defaults(ck || {}, defaultCK);
	        return (function _clone(src) {
	            // primitives and functions
	            if (isPrimitive(src)) return src;
	            if (isFunction(src)) return src;
	            var sig = signatureOf(src);
	            switch (sig) {
	            case '[object Array]':
	            case '[object Object]':
	                if (wm) {
	                    if (wm.has(src)) {
	                        // console.log('circular ref found');
	                        return src;
	                    }
	                    wm.set(src, true);
	                }
	                var isarray = isArray(src);
	                var dst = isarray ? [] : create(getPrototypeOf(src));
	                ck.enumerator(src).forEach(function(k) {
	                    // Firefox forbids defineProperty(obj, 'length' desc)
	                    if (isarray && k === 'length') {
	                        dst.length = src.length;
	                    } else {
	                        if (ck.descriptors) {
	                            var desc = getOwnPropertyDescriptor(src, k);
	                            if (ck.filter && !ck.filter(desc, k, src)) return;
	                            if (deep && 'value' in desc) 
	                                desc.value = _clone(src[k]);
	                            defineProperty(dst, k, desc);
	                        } else {
	                            dst[k] = _clone(src[k]);
	                        }
	                    }
	                });
	                if (ck.extensibility) {
	                    if (!isExtensible(src)) preventExtensions(dst);
	                    if (isSealed(src)) seal(dst);
	                    if (isFrozen(src)) freeze(dst);
	                }
	                return dst;
	            case '[object RegExp]':
	            case '[object Date]':
	            case '[object String]':
	            case '[object Number]':
	            case '[object Boolean]':
	                return deep ? new src.constructor(src.valueOf()) : src;
	            default:
	                throw TypeError(sig + ' is not supported');
	            }
	        })(src);
	    };
	    //  Install
	    var obj2specs = function(src) {
	        var specs = create(null);
	        getOwnPropertyNames(src).forEach(function(k) {
	            specs[k] = {
	                value: src[k],
	                configurable: true,
	                writable: true,
	                enumerable: false
	            };
	        });
	        return specs;
	    };
	    var defaultProperties = function(dst, descs) {
	        getOwnPropertyNames(descs).forEach(function(k) {
	            if (!hasOwnProperty.call(dst, k)) defineProperty(
	                dst, k, descs[k]
	            );
	        });
	        return dst;
	    };
	    (Object.installProperties || defaultProperties)(Object, obj2specs({
	        clone: clone,
	        is: is,
	        isnt: isnt,
	        equals: equals
	    }));
	})(this);


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	/**@license MIT-promiscuous-©Ruben Verborgh*/
	(function (func, obj) {
	  // Type checking utility function
	  function is(type, item) { return (typeof item)[0] == type; }

	  // Creates a promise, calling callback(resolve, reject), ignoring other parameters.
	  function Promise(callback, handler) {
	    // The `handler` variable points to the function that will
	    // 1) handle a .then(resolved, rejected) call
	    // 2) handle a resolve or reject call (if the first argument === `is`)
	    // Before 2), `handler` holds a queue of callbacks.
	    // After 2), `handler` is a finalized .then handler.
	    handler = function pendingHandler(resolved, rejected, value, queue, then, i) {
	      queue = pendingHandler.q;

	      // Case 1) handle a .then(resolved, rejected) call
	      if (resolved != is) {
	        return Promise(function (resolve, reject) {
	          queue.push({ p: this, r: resolve, j: reject, 1: resolved, 0: rejected });
	        });
	      }

	      // Case 2) handle a resolve or reject call
	      // (`resolved` === `is` acts as a sentinel)
	      // The actual function signature is
	      // .re[ject|solve](<is>, success, value)

	      // Check if the value is a promise and try to obtain its `then` method
	      if (value && (is(func, value) | is(obj, value))) {
	        try { then = value.then; }
	        catch (reason) { rejected = 0; value = reason; }
	      }
	      // If the value is a promise, take over its state
	      if (is(func, then)) {
	        function valueHandler(resolved) {
	          return function (value) { then && (then = 0, pendingHandler(is, resolved, value)); };
	        }
	        try { then.call(value, valueHandler(1), rejected = valueHandler(0)); }
	        catch (reason) { rejected(reason); }
	      }
	      // The value is not a promise; handle resolve/reject
	      else {
	        // Replace this handler with a finalized resolved/rejected handler
	        handler = function (Resolved, Rejected) {
	          // If the Resolved or Rejected parameter is not a function,
	          // return the original promise (now stored in the `callback` variable)
	          if (!is(func, (Resolved = rejected ? Resolved : Rejected)))
	            return callback;
	          // Otherwise, return a finalized promise, transforming the value with the function
	          return Promise(function (resolve, reject) { finalize(this, resolve, reject, value, Resolved); });
	        };
	        // Resolve/reject pending callbacks
	        i = 0;
	        while (i < queue.length) {
	          then = queue[i++];
	          // If no callback, just resolve/reject the promise
	          if (!is(func, resolved = then[rejected]))
	            (rejected ? then.r : then.j)(value);
	          // Otherwise, resolve/reject the promise with the result of the callback
	          else
	            finalize(then.p, then.r, then.j, value, resolved);
	        }
	      }
	    };
	    // The queue of pending callbacks; garbage-collected when handler is resolved/rejected
	    handler.q = [];

	    // Create and return the promise (reusing the callback variable)
	    callback.call(callback = { then:  function (resolved, rejected) { return handler(resolved, rejected); },
	                               catch: function (rejected)           { return handler(0,        rejected); } },
	                  function (value)  { handler(is, 1,  value); },
	                  function (reason) { handler(is, 0, reason); });
	    return callback;
	  }

	  // Finalizes the promise by resolving/rejecting it with the transformed value
	  function finalize(promise, resolve, reject, value, transform) {
	    setImmediate(function () {
	      try {
	        // Transform the value through and check whether it's a promise
	        value = transform(value);
	        transform = value && (is(obj, value) | is(func, value)) && value.then;
	        // Return the result if it's not a promise
	        if (!is(func, transform))
	          resolve(value);
	        // If it's a promise, make sure it's not circular
	        else if (value == promise)
	          reject(TypeError());
	        // Take over the promise's state
	        else
	          transform.call(value, resolve, reject);
	      }
	      catch (error) { reject(error); }
	    });
	  }

	  // Export the main module
	  module.exports = Promise;

	  // Creates a resolved promise
	  Promise.resolve = ResolvedPromise;
	  function ResolvedPromise(value) { return Promise(function (resolve) { resolve(value); }); }

	  // Creates a rejected promise
	  Promise.reject = function (reason) { return Promise(function (resolve, reject) { reject(reason); }); };

	  // Transforms an array of promises into a promise for an array
	  Promise.all = function (promises) {
	    return Promise(function (resolve, reject, count, values) {
	      // Array of collected values
	      values = [];
	      // Resolve immediately if there are no promises
	      count = promises.length || resolve(values);
	      // Transform all elements (`map` is shorter than `forEach`)
	      promises.map(function (promise, index) {
	        ResolvedPromise(promise).then(
	          // Store the value and resolve if it was the last
	          function (value) {
	            values[index] = value;
	            --count || resolve(values);
	          },
	          // Reject if one element fails
	          reject);
	      });
	    });
	  };
	})('f', 'o');


/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(11);
	var bodyDelegate = __webpack_require__(12)();
	document.addEventListener('DOMContentLoaded',function(){
	  bodyDelegate.root(document.body);
	},false);

	function Router(options) {
	    var self = this;
	    options = options || [];
	    this._routes = [];
	    this.currentRoute = null;

	    if(options.routes) {
	      for(var id in options.routes){
	        this.add(options.routes[id],id);
	      }
	    }
	    this.base = '';
	    if(options.base){
	      this.base = options.base;
	      if(this.base[0] !== '/')
	        this.base = '/' + this.base;
	      if(this.base[this.base.length-1] === '/')
	        this.base = this.base.substr(0,this.base.length-1);
	    }
	    if(typeof options.callback === 'function') {
	      this._callback = options.callback;
	    }

	    // override default click intercept, if wanted
	    if(typeof options.startClickIntercept === 'function'){
	      self.startClickIntercept = startClickIntercept.bind(self);
	    }
	    if(typeof options.stopClickIntercept === 'function'){
	      self.stopClickIntercept = stopClickIntercept.bind(self);
	    }

	    if(typeof options.html5 === 'undefined') options.html5 = true;
	    if(options.html5 === true && 'onpopstate' in window){
	      this.html5 = true;
	      window.addEventListener('popstate',function(ev){
	        self.set(ev.state.url);
	      });
	    } else {
	      this.html5 = false;
	      window.addEventListener('hashchange',function(ev){
	        self.set(window.location.hash.substr(1));
	      });
	    }
	    if(this.html5 || options.interceptClicks){
	      self.startClickIntercept();
	    }
	}

	Router.prototype.normalize = function(url){
	  url = url || '/';
	  if(url[0] === '#') {
	    url = url.substr(1);
	  }
	  if(url.startsWith(location.origin)){
	    url = url.substr(location.origin.length);
	  }
	  if(url.startsWith(this.base)){
	    url = url.substr(this.base.length);
	  }
	  if(url[0] !== '/') url = '/' + url;
	  if(url.length > 1 && url[url.length-1] === '/') url = url.substr(0,url.length-1);
	  return url;
	};

	Router.prototype.add = function RouterAdd(route,callback) {
	  route = this.normalize(route);
	  var normalizedRoute = route;
	  if(route === '/*') {
	    this._otherwise = callback || this._callback;
	    return route;
	  }
	  var keys;
	  var params = route.match(/:[a-zA-Z0-9]+/g) || [];
	  keys = params.map(function(key){
	    return key.substr(1);
	  });
	  for (var i = params.length - 1; i >= 0; i--) {
	    route = route.replace(params[i],'([^\/]+)');
	  }
	  route = '^' + route.replace(/\//g,'\\/') + '$';

	  this._routes.push({
	    route: normalizedRoute,
	    regex: new RegExp(route),
	    params: keys,
	    callback: callback || this._callback
	  });
	  return route;
	};

	Router.prototype.setCallback = function RouterSetCallback(fn){
	  this._callback = fn;
	};

	Router.prototype.set = function RouterSet(url) {
	  var current = this.html5? location.href: location.hash.substr(1);
	  url = this.normalize(url || current);
	  if(this.html5){
	    history.pushState({url:url},url,url);
	  } else {
	    location.hash = url;
	  }
	  var found = false,
	      i = this._routes.length - 1,
	      matches,
	      params = {};

	  while(i >= 0 && !found) {
	    matches = url.match(this._routes[i].regex);
	    if(matches !== null) {
	      found = true;
	      matches = matches.splice(1);
	      this._routes[i].params.forEach(function(key){
	        params[key] = matches[key];
	      });
	      this._routes[i].callback(params,this._routes[i].route);
	      this.currentRoute = this._routes[i].route;
	    }
	    i--;
	  }
	  if(!found && this._otherwise) {
	    this._otherwise(params,'/*');
	    found = true;
	  }
	  return found;
	};

	Router.prototype.interceptClick = function(ev){
	  var url = ev.target.getAttribute('href');
	  if(url){
	    url = this.normalize(url);
	    if(url.substr(0,4) !== 'http' && this.set(url)) {
	      ev.preventDefault();
	    }
	  }
	};

	Router.prototype.startClickIntercept = function(){
	  bodyDelegate.on('click','a',this.interceptClick.bind(this));
	  window.del = bodyDelegate;
	};


	Router.prototype.stopClickIntercept = function(){
	  bodyDelegate.destroy();
	};

	module.exports = Router;

/***/ },
/* 9 */,
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	smokesignals = {
	    convert: function(obj, handlers) {
	        // we store the list of handlers as a local variable inside the scope
	        // so that we don't have to add random properties to the object we are
	        // converting. (prefixing variables in the object with an underscore or
	        // two is an ugly solution)
	        // we declare the variable in the function definition to use two less
	        // characters (as opposed to using 'var ').  I consider this an inelegant
	        // solution since smokesignals.convert.length now returns 2 when it is
	        // really 1, but doing this doesn't otherwise change the functionallity of
	        // this module, so we'll go with it for now
	        handlers = {};

	        // add a listener
	        obj.on = function(eventName, handler) {
	            // either use the existing array or create a new one for this event
	            (handlers[eventName] || (handlers[eventName] = []))
	                // add the handler to the array
	                .push(handler);

	            return obj;
	        }

	        // add a listener that will only be called once
	        obj.once = function(eventName, handler) {
	            // create a wrapper listener, that will remove itself after it is called
	            function wrappedHandler() {
	                // remove ourself, and then call the real handler with the args
	                // passed to this wrapper
	                handler.apply(obj.off(eventName, wrappedHandler), arguments);
	            }
	            // in order to allow that these wrapped handlers can be removed by
	            // removing the original function, we save a reference to the original
	            // function
	            wrappedHandler.h = handler;

	            // call the regular add listener function with our new wrapper
	            return obj.on(eventName, wrappedHandler);
	        }

	        // remove a listener
	        obj.off = function(eventName, handler) {
	            // loop through all handlers for this eventName, assuming a handler
	            // was passed in, to see if the handler passed in was any of them so
	            // we can remove it
	            for (var list = handlers[eventName], i = 0; handler && list && list[i]; i++) {
	                // either this item is the handler passed in, or this item is a
	                // wrapper for the handler passed in.  See the 'once' function
	                list[i] != handler && list[i].h != handler ||
	                    // remove it!
	                    list.splice(i--,1);
	            }
	            // if i is 0 (i.e. falsy), then there are no items in the array for this
	            // event name (or the array doesn't exist)
	            if (!i) {
	                // remove the array for this eventname (if it doesn't exist then
	                // this isn't really hurting anything)
	                delete handlers[eventName];
	            }
	            return obj;
	        }

	        obj.emit = function(eventName) {
	            // loop through all handlers for this event name and call them all
	            for(var list = handlers[eventName], i = 0; list && list[i];) {
	                list[i++].apply(obj, list.slice.call(arguments, 1));
	            }
	            return obj;
	        }

	        return obj;
	    }
	}


/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	// Taken from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
	if (!Function.prototype.bind) {
	  Function.prototype.bind = function (oThis) {
	    if (typeof this !== "function") {
	      // closest thing possible to the ECMAScript 5
	      // internal IsCallable function
	      throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
	    }

	    var aArgs = Array.prototype.slice.call(arguments, 1), 
	        fToBind = this, 
	        fNOP = function () {},
	        fBound = function () {
	          return fToBind.apply(this instanceof fNOP && oThis
	                 ? this
	                 : oThis,
	                 aArgs.concat(Array.prototype.slice.call(arguments)));
	        };

	    fNOP.prototype = this.prototype;
	    fBound.prototype = new fNOP();

	    return fBound;
	  };
	}


/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	/*jshint browser:true, node:true*/

	'use strict';

	/**
	 * @preserve Create and manage a DOM event delegator.
	 *
	 * @version 0.3.0
	 * @codingstandard ftlabs-jsv2
	 * @copyright The Financial Times Limited [All Rights Reserved]
	 * @license MIT License (see LICENSE.txt)
	 */
	var Delegate = __webpack_require__(13);

	module.exports = function(root) {
	  return new Delegate(root);
	};

	module.exports.Delegate = Delegate;


/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	/*jshint browser:true, node:true*/

	'use strict';

	module.exports = Delegate;

	/**
	 * DOM event delegator
	 *
	 * The delegator will listen
	 * for events that bubble up
	 * to the root node.
	 *
	 * @constructor
	 * @param {Node|string} [root] The root node or a selector string matching the root node
	 */
	function Delegate(root) {

	  /**
	   * Maintain a map of listener
	   * lists, keyed by event name.
	   *
	   * @type Object
	   */
	  this.listenerMap = [{}, {}];
	  if (root) {
	    this.root(root);
	  }

	  /** @type function() */
	  this.handle = Delegate.prototype.handle.bind(this);
	}

	/**
	 * Start listening for events
	 * on the provided DOM element
	 *
	 * @param  {Node|string} [root] The root node or a selector string matching the root node
	 * @returns {Delegate} This method is chainable
	 */
	Delegate.prototype.root = function(root) {
	  var listenerMap = this.listenerMap;
	  var eventType;

	  // Remove master event listeners
	  if (this.rootElement) {
	    for (eventType in listenerMap[1]) {
	      if (listenerMap[1].hasOwnProperty(eventType)) {
	        this.rootElement.removeEventListener(eventType, this.handle, true);
	      }
	    }
	    for (eventType in listenerMap[0]) {
	      if (listenerMap[0].hasOwnProperty(eventType)) {
	        this.rootElement.removeEventListener(eventType, this.handle, false);
	      }
	    }
	  }

	  // If no root or root is not
	  // a dom node, then remove internal
	  // root reference and exit here
	  if (!root || !root.addEventListener) {
	    if (this.rootElement) {
	      delete this.rootElement;
	    }
	    return this;
	  }

	  /**
	   * The root node at which
	   * listeners are attached.
	   *
	   * @type Node
	   */
	  this.rootElement = root;

	  // Set up master event listeners
	  for (eventType in listenerMap[1]) {
	    if (listenerMap[1].hasOwnProperty(eventType)) {
	      this.rootElement.addEventListener(eventType, this.handle, true);
	    }
	  }
	  for (eventType in listenerMap[0]) {
	    if (listenerMap[0].hasOwnProperty(eventType)) {
	      this.rootElement.addEventListener(eventType, this.handle, false);
	    }
	  }

	  return this;
	};

	/**
	 * @param {string} eventType
	 * @returns boolean
	 */
	Delegate.prototype.captureForType = function(eventType) {
	  return ['blur', 'error', 'focus', 'load', 'resize', 'scroll'].indexOf(eventType) !== -1;
	};

	/**
	 * Attach a handler to one
	 * event for all elements
	 * that match the selector,
	 * now or in the future
	 *
	 * The handler function receives
	 * three arguments: the DOM event
	 * object, the node that matched
	 * the selector while the event
	 * was bubbling and a reference
	 * to itself. Within the handler,
	 * 'this' is equal to the second
	 * argument.
	 *
	 * The node that actually received
	 * the event can be accessed via
	 * 'event.target'.
	 *
	 * @param {string} eventType Listen for these events
	 * @param {string|undefined} selector Only handle events on elements matching this selector, if undefined match root element
	 * @param {function()} handler Handler function - event data passed here will be in event.data
	 * @param {Object} [eventData] Data to pass in event.data
	 * @returns {Delegate} This method is chainable
	 */
	Delegate.prototype.on = function(eventType, selector, handler, useCapture) {
	  var root, listenerMap, matcher, matcherParam;

	  if (!eventType) {
	    throw new TypeError('Invalid event type: ' + eventType);
	  }

	  // handler can be passed as
	  // the second or third argument
	  if (typeof selector === 'function') {
	    useCapture = handler;
	    handler = selector;
	    selector = null;
	  }

	  // Fallback to sensible defaults
	  // if useCapture not set
	  if (useCapture === undefined) {
	    useCapture = this.captureForType(eventType);
	  }

	  if (typeof handler !== 'function') {
	    throw new TypeError('Handler must be a type of Function');
	  }

	  root = this.rootElement;
	  listenerMap = this.listenerMap[useCapture ? 1 : 0];

	  // Add master handler for type if not created yet
	  if (!listenerMap[eventType]) {
	    if (root) {
	      root.addEventListener(eventType, this.handle, useCapture);
	    }
	    listenerMap[eventType] = [];
	  }

	  if (!selector) {
	    matcherParam = null;

	    // COMPLEX - matchesRoot needs to have access to
	    // this.rootElement, so bind the function to this.
	    matcher = matchesRoot.bind(this);

	  // Compile a matcher for the given selector
	  } else if (/^[a-z]+$/i.test(selector)) {
	    matcherParam = selector;
	    matcher = matchesTag;
	  } else if (/^#[a-z0-9\-_]+$/i.test(selector)) {
	    matcherParam = selector.slice(1);
	    matcher = matchesId;
	  } else {
	    matcherParam = selector;
	    matcher = matches;
	  }

	  // Add to the list of listeners
	  listenerMap[eventType].push({
	    selector: selector,
	    handler: handler,
	    matcher: matcher,
	    matcherParam: matcherParam
	  });

	  return this;
	};

	/**
	 * Remove an event handler
	 * for elements that match
	 * the selector, forever
	 *
	 * @param {string} [eventType] Remove handlers for events matching this type, considering the other parameters
	 * @param {string} [selector] If this parameter is omitted, only handlers which match the other two will be removed
	 * @param {function()} [handler] If this parameter is omitted, only handlers which match the previous two will be removed
	 * @returns {Delegate} This method is chainable
	 */
	Delegate.prototype.off = function(eventType, selector, handler, useCapture) {
	  var i, listener, listenerMap, listenerList, singleEventType;

	  // Handler can be passed as
	  // the second or third argument
	  if (typeof selector === 'function') {
	    useCapture = handler;
	    handler = selector;
	    selector = null;
	  }

	  // If useCapture not set, remove
	  // all event listeners
	  if (useCapture === undefined) {
	    this.off(eventType, selector, handler, true);
	    this.off(eventType, selector, handler, false);
	    return this;
	  }

	  listenerMap = this.listenerMap[useCapture ? 1 : 0];
	  if (!eventType) {
	    for (singleEventType in listenerMap) {
	      if (listenerMap.hasOwnProperty(singleEventType)) {
	        this.off(singleEventType, selector, handler);
	      }
	    }

	    return this;
	  }

	  listenerList = listenerMap[eventType];
	  if (!listenerList || !listenerList.length) {
	    return this;
	  }

	  // Remove only parameter matches
	  // if specified
	  for (i = listenerList.length - 1; i >= 0; i--) {
	    listener = listenerList[i];

	    if ((!selector || selector === listener.selector) && (!handler || handler === listener.handler)) {
	      listenerList.splice(i, 1);
	    }
	  }

	  // All listeners removed
	  if (!listenerList.length) {
	    delete listenerMap[eventType];

	    // Remove the main handler
	    if (this.rootElement) {
	      this.rootElement.removeEventListener(eventType, this.handle, useCapture);
	    }
	  }

	  return this;
	};


	/**
	 * Handle an arbitrary event.
	 *
	 * @param {Event} event
	 */
	Delegate.prototype.handle = function(event) {
	  var i, l, type = event.type, root, phase, listener, returned, listenerList = [], target, /** @const */ EVENTIGNORE = 'ftLabsDelegateIgnore';

	  if (event[EVENTIGNORE] === true) {
	    return;
	  }

	  target = event.target;

	  // Hardcode value of Node.TEXT_NODE
	  // as not defined in IE8
	  if (target.nodeType === 3) {
	    target = target.parentNode;
	  }

	  root = this.rootElement;

	  phase = event.eventPhase || ( event.target !== event.currentTarget ? 3 : 2 );
	  
	  switch (phase) {
	    case 1: //Event.CAPTURING_PHASE:
	      listenerList = this.listenerMap[1][type];
	    break;
	    case 2: //Event.AT_TARGET:
	      if (this.listenerMap[0] && this.listenerMap[0][type]) listenerList = listenerList.concat(this.listenerMap[0][type]);
	      if (this.listenerMap[1] && this.listenerMap[1][type]) listenerList = listenerList.concat(this.listenerMap[1][type]);
	    break;
	    case 3: //Event.BUBBLING_PHASE:
	      listenerList = this.listenerMap[0][type];
	    break;
	  }

	  // Need to continuously check
	  // that the specific list is
	  // still populated in case one
	  // of the callbacks actually
	  // causes the list to be destroyed.
	  l = listenerList.length;
	  while (target && l) {
	    for (i = 0; i < l; i++) {
	      listener = listenerList[i];

	      // Bail from this loop if
	      // the length changed and
	      // no more listeners are
	      // defined between i and l.
	      if (!listener) {
	        break;
	      }

	      // Check for match and fire
	      // the event if there's one
	      //
	      // TODO:MCG:20120117: Need a way
	      // to check if event#stopImmediatePropagation
	      // was called. If so, break both loops.
	      if (listener.matcher.call(target, listener.matcherParam, target)) {
	        returned = this.fire(event, target, listener);
	      }

	      // Stop propagation to subsequent
	      // callbacks if the callback returned
	      // false
	      if (returned === false) {
	        event[EVENTIGNORE] = true;
	        event.preventDefault();
	        return;
	      }
	    }

	    // TODO:MCG:20120117: Need a way to
	    // check if event#stopPropagation
	    // was called. If so, break looping
	    // through the DOM. Stop if the
	    // delegation root has been reached
	    if (target === root) {
	      break;
	    }

	    l = listenerList.length;
	    target = target.parentElement;
	  }
	};

	/**
	 * Fire a listener on a target.
	 *
	 * @param {Event} event
	 * @param {Node} target
	 * @param {Object} listener
	 * @returns {boolean}
	 */
	Delegate.prototype.fire = function(event, target, listener) {
	  return listener.handler.call(target, event, target);
	};

	/**
	 * Check whether an element
	 * matches a generic selector.
	 *
	 * @type function()
	 * @param {string} selector A CSS selector
	 */
	var matches = (function(el) {
	  if (!el) return;
	  var p = el.prototype;
	  return (p.matches || p.matchesSelector || p.webkitMatchesSelector || p.mozMatchesSelector || p.msMatchesSelector || p.oMatchesSelector);
	}(Element));

	/**
	 * Check whether an element
	 * matches a tag selector.
	 *
	 * Tags are NOT case-sensitive,
	 * except in XML (and XML-based
	 * languages such as XHTML).
	 *
	 * @param {string} tagName The tag name to test against
	 * @param {Element} element The element to test with
	 * @returns boolean
	 */
	function matchesTag(tagName, element) {
	  return tagName.toLowerCase() === element.tagName.toLowerCase();
	}

	/**
	 * Check whether an element
	 * matches the root.
	 *
	 * @param {?String} selector In this case this is always passed through as null and not used
	 * @param {Element} element The element to test with
	 * @returns boolean
	 */
	function matchesRoot(selector, element) {
	  /*jshint validthis:true*/
	  if (this.rootElement === window) return element === document;
	  return this.rootElement === element;
	}

	/**
	 * Check whether the ID of
	 * the element in 'this'
	 * matches the given ID.
	 *
	 * IDs are case-sensitive.
	 *
	 * @param {string} id The ID to test against
	 * @param {Element} element The element to test with
	 * @returns boolean
	 */
	function matchesId(id, element) {
	  return id === element.id;
	}

	/**
	 * Short hand for off()
	 * and root(), ie both
	 * with no parameters
	 *
	 * @return void
	 */
	Delegate.prototype.destroy = function() {
	  this.off();
	  this.root();
	};


/***/ }
/******/ ])