var elCache = {};
module.exports = function(id){
	if(elCache[id]) return elCache[id];
	return document.getElementById(id);
};