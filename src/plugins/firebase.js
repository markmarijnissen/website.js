function getFirebaseData(url,fix,callback){
	var ref = new Firebase(url);
	ref.once('value',function(snap){
		var data = fix? fixSitemap(snap.val()): snap.val();
		if(data){
			callback(null,data);
		} else {
			callback('no data',null);
		}
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


var FirebasePlugin = {
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
	getContent: function(id,callback){
		return getFirebaseData(this.options.contentUrl + id,false,callback);
	},
	getData: function(callback){
		return getFirebaseData(this.options.dataUrl,true,callback);
	}
};

if(window.Website) window.Website.plugins.firebase = FirebasePlugin;
module.exports = FirebasePlugin;