require('js-object-clone');
var isEqual = require('lodash-node/modern/objects/isEqual');

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
			var normalizedUrl = self.router.normalize(url);
			if(!isEqual(self.sitemap[normalizedUrl],data.sitemap[url])){
				self.setDataForUrl(normalizedUrl,data.sitemap[url]);
			}
		});

		// Trigger router for first load
		self.router.set();
	},
	gotDataForUrl: function(url,data){
		this.sitemap[url] = data;	// save in sitemap
		this.router.add(url);		// add new route (or override existing one)
		if(url === this.url) this.refresh(0); // refresh if needed
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
					}
					self.navigating = false;	
				});
		} else {
			self.emit('navigationError','not_found');
			self.navigating = false;
		}
	},
	gotContent: function(id,content){
		// Refresh page when getting content! (only when not already navigating...)
		if(!this.navigating && checkContentForId(this.sitemap[this.url],id))
		{
			this.refresh(0);
		}
	}
};