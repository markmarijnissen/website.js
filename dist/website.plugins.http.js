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

	function http(url,json,cb) {
	  var xhr = new XMLHttpRequest();
	  xhr.open('GET', url);
	  xhr.onreadystatechange = function() {
	   if (xhr.readyState == 4 && cb) {
	      var data;
	      if(json){
	          try {
	            data = JSON.parse(xhr.responseText);
	          } catch (e) {}
	        } else {
	          data = xhr.responseText;
	        }
	        if(xhr.status === 200){
	          cb(null,data);
	        } else {
	          cb(xhr.status,xhr);
	        }
	      }
	  };
	  xhr.send();
	  return xhr;
	}

	var HttpPlugin = {
	  created: function(options){
	    options.http = options.http || {};
	    var contentFn = options.http.content;
	    if(typeof contentFn === 'string'){
	      var url = contentFn || location.origin;
	      if(url[url.length-1] !== '/') {
	        url += '/';
	      }
	      options.http.content = function(id){ return url + id; };
	    } else if(typeof contentFn !== 'function'){
	      console.error('options.http.content must be a string or function');
	    }
	  },
		getContent: function(id,callback){
			return http(this.options.http.content.call(this,id),false,callback);
		},
		getData: function(callback){
			return http(this.options.http.data,true,callback);
		}
	};

	if(window.Website) window.Website.plugins.http = HttpPlugin;
	module.exports = HttpPlugin;

/***/ }
/******/ ])