require('../libs/localforage.custom');
var Promise = require('Promise');

var CachePlugin = {
	created: function(){
		var self = this;
		localforage.getItem('contentids')
			.then(function(ids){
				console.log('ids',ids);
				return Promise.all(ids.map(function(id){
					return localforage.getItem('content:'+id)
						.then(function(content){
							//self.content[id] = content;
							self.setContent(id,content);
							return id;
						});
				}));
			})
			.then(function(ids){
				console.log('restored content ids',ids);
				return localforage.getItem('data');
			})
			.then(function(data){
				self.setData(data);
			},function(err){
				console.error('cache error',err);
			});
	},
	gotContent: function(id){
		localforage.setItem('contentids',Object.keys(this.content));
		localforage.setItem('content:'+id,this.content[id]);
	},
	gotData: function(data){
		console.log('gotData cache',data);
		localforage.setItem('data',data);
	}
};

if(window.Website) window.Website.plugins.cache = CachePlugin;
module.exports = CachePlugin;