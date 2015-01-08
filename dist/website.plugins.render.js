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

	var getElement = __webpack_require__(2);

	var RenderPlugin = {
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

	if(window.Website) window.Website.plugins.render = RenderPlugin;
	module.exports = RenderPlugin;

/***/ },
/* 1 */,
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	var elCache = {};
	module.exports = function(id){
		if(elCache[id]) return elCache[id];
		return document.getElementById(id);
	};

/***/ }
/******/ ])