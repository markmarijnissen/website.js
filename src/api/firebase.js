var Promise = require('Promise');

function getFirebaseData(url,fix){
	return new Promise(function(resolve,reject){
		var ref = new Firebase(url);
		ref.once('value',function(snap){
			var data = fix? fixSitemap(snap.val()): snap.val();
			resolve(data);
		},reject);
	});
}

function fixSlash(url){
  return url.replace(/\\/,'/');
}

function fixSitemap(data) {
	var sitemap = {};
	Object.keys(data.sitemap).forEach(function(key){
		sitemap[fixSlash(key)] = data.sitemap[key];
	});
	data.sitemap = sitemap;
	return data;
}


var API = {
	created: function(options){
		var self = this;
		if(options.dataUrl[options.dataUrl.length-1] !== '/') {
			options.dataUrl += '/';
		}

		dataRef = new Firebase(this.options.dataUrl);
		dataRef.on('value',function(snap){
			self.data = fixSitemap(snap.val());
		});

		sitemapRef = new Firebase(this.options.dataUrl + 'sitemap');
		sitemapRef.on('child_changed',function(snap){
			self.setDataForUrl(fixSlash(snap.key()),snap.val());
		});

		if(options.contentUrl[options.contentUrl.length-1] !== '/') {
			options.contentUrl += '/';
		}

		contentRef = new Firebase(this.options.contentUrl);
		contentRef.on('child_changed',function(snap){
			self.setContent(snap.key(),snap.val());
		});
	},
	getContent: function(id){
		return getFirebaseData(this.options.contentUrl + id);
	},
	getData: function(){
		return getFirebaseData(this.options.dataUrl,true);
	}
};

if(window.Website) window.Website.api.firebase = API;
module.exports = API;