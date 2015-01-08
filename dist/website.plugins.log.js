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

/***/ }
/******/ ])