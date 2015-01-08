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

	__webpack_require__(3);

	var Router = __webpack_require__(5);
	var smokesignals = __webpack_require__(4);

	function Website(options){
		var self = this;
		self.options = options = options || {};
		options.router = options.router || {};
		options.router.callback = routerCallback.bind(this);

		// Setup Router
		self.router = new Router(options.router);

		// Setup Website State + Events
		smokesignals.convert(this);

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
		core: __webpack_require__(1)
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
						self.emit('gotContent',obj,content);
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
						result[key] = self.content[obj[key]];
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

	Website.prototype.refresh = function(){
		this.emit('navigated',this.router.currentParams,this.router.currentRoute);
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

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(7);

	function checkContentForId(metadata,val){
		if(!metadata || !metadata.content) return false;
		if(metadata.content === val) return true;
		if(typeof metadata !== 'object') return false;
		for(var key in metadata.content){
			if(metadata.content[key] === val) return true;
		}
		return false;
	}

	module.exports = {
		created: function(){
			this.url = null;   // store url
			this.data = null;  // store data
			this.sitemap = {}; // store sitemap
			this.content = {}; // cache content
		},
		gotData: function(data){
			var self = this;

			// validate data
			if(typeof data !== 'object' || data === null || typeof data.sitemap !== 'object') {
				self.emit('dataError','data is invalid');
				return;
			}
			// save data
			self.data = data;

			// Update sitemap
			Object.keys(data.sitemap).forEach(function(url){
				self.setDataForUrl(self.router.normalize(url),data.sitemap[url]);
			});

			// Trigger router for first load
			self.router.set();
		},
		gotDataForUrl: function(url,data){
			this.sitemap[url] = data;	// save in sitemap
			this.router.add(url);		// add new route
			if(url === this.url) this.refresh(); // refresh if needed
		},
		navigated: function(params,url){
			this.navigating = true;
			var self = this;
			
			// save url
			self.url = url;

			// get sitemap page metadata
			var data = self.sitemap[url];
			if(data){
				// enhance data with URL and params
				data = Object.clone(data,true);
				data.url = url;
				data.params = params;

				// replace data.content with actual content
				self.getContent(data.content,function gotContent(err,content){
						if(!err){
							data.content = content;
							self.render(data);
						} else {
							console.error('navigated getContent error',err);
						}
						self.navigating = false;	
					});
			} else {
				self.emit('navigationError','not_found');
				self.navigating = false;
			}
		},
		gotContent: function(id,content){
			this.content[id] = content;
			if(!this.navigating && checkContentForId(this.sitemap[this.url],id))
			{  // TODO what if gotContent is triggered while navigating?
				this.refresh();
			}
		},
		
		render: null,
		rendered: null,

		dataError: null,
		contentError: null,
		navigationError: null
	};

/***/ },
/* 2 */,
/* 3 */
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
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {var existed = false;
	var old;

	if ('smokesignals' in global) {
	    existed = true;
	    old = global.smokesignals;
	}

	__webpack_require__(8);

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

	__webpack_require__(9);
	var bodyDelegate = __webpack_require__(10)();
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
	      window.addEventListener('popstate',function RouterOnPopState(ev){
	        self.set(ev.state.url,true);
	      });
	    } else {
	      this.html5 = false;
	      window.addEventListener('hashchange',function RouterOnHashChange(ev){
	        self.set(window.location.hash.substr(1),true);
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
	  var i,normalizedRoute = route;
	  
	  // check if route already exists
	  for(i = 0, len = this._routes.length; i<len; i++){
	    if(this._routes[i].route === normalizedRoute) {
	      this._routes[i] = callback || this._callback;
	      return;
	    }
	  }

	  // check for 'otherwise' route
	  if(route === '/*') {
	    this._otherwise = callback || this._callback;
	    return route;
	  }

	  // add route
	  var keys;
	  var params = route.match(/:[a-zA-Z0-9]+/g) || [];
	  keys = params.map(function(key){
	    return key.substr(1);
	  });
	  for (i = params.length - 1; i >= 0; i--) {
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

	Router.prototype.set = function RouterSet(url,silent) {
	  var current = this.html5? location.href: location.hash.substr(1);
	  url = this.normalize(url || current);
	  if(this.html5 && !silent){
	    history.pushState({url:url},url,url);
	  } else if(!silent){
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
	      this.currentParams = params;
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
	    if(url.substr(0,4) !== 'http') {
	      if(this.html5){
	        history.pushState({url:url},url,url);
	      } else {
	        location.hash = url;
	      }
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
/* 6 */,
/* 7 */
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
/* 8 */
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
/* 9 */
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
/* 10 */
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
	var Delegate = __webpack_require__(11);

	module.exports = function(root) {
	  return new Delegate(root);
	};

	module.exports.Delegate = Delegate;


/***/ },
/* 11 */
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