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
		Object.keys(data.sitemap).forEach(function(_url){
			var url = self.router.normalize(_url);
			self.setDataForUrl(url,self.sitemap[url]);
		});
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
					}	
				});
		} else {
			self.emit('navigationError','not_found');
		}
		this.navigating = false;
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