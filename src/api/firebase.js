var Promise = require('Promise');

function getFirebaseData(url){
	return new Promise(function(resolve,reject){
		var ref = new Firebase(url);
		ref.once('value',function(snap){
			resolve(snap.val());
		},reject);
	});
}

var API = {
	start: function(){
		if(typeof Firebase === 'undefined'){
			throw new Error("Need to include Firebase");
		}
		// initialize firebase refs
	},
	getContent: function(url){
		return getFirebaseData(this.options.contentUrl + url);
	},
	getData: function(){
		return getFirebaseData(this.options.dataUrl);
	}
};


// Auto install itself on ContentSite
Website.prototype.api = API;
module.exports = API;