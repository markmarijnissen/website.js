function fix(data){
	if(typeof data === 'string'){
		return data.replace(/\\/,'/').replace(/-dot-/g,'.');
	} else if(typeof data === 'object' && typeof data.sitemap === 'object'){
		var sitemap = {};
		for(var key in data.sitemap){
			sitemap[fix(key)] = data.sitemap[key];
		}
		data.sitemap = sitemap;
	}
	return data;
}

function safe(url){
	return url.replace(/\//,'\\').replace(/\./g,'-dot-');
}


var FirebasePlugin = {
	created: function(options){
		var self = this;
		if(!options.firebase || !options.firebase.content || !options.firebase.data){
			self.emit('dataError','no firebase url');
			self.emit('contentError','no firebase url');
			return;
		}

		if(options.firebase.content[options.firebase.content.length-1] !== '/') {
			options.firebase.content += '/';
		}
		dataRef = new Firebase(options.firebase.data);
		dataRef.on('value',function(snap){
			var data = fix(snap.val());
			self.setData(data);
		});

		contentRef = new Firebase(options.firebase.content);
		contentRef.on('child_changed',function(snap){
			self.setContent(safe(snap.key()),snap.val());
		});
	},
	getContent: function(id,callback){
		var ref = new Firebase(this.options.firebase.content + safe(id));
		ref.once('value',function(snap){
			var content = snap.val();
			if(content){
				callback(null,content);
			} else {
				callback('no content');
			}
		},function(err){
			callback(err);
		});
	}
};

if(window.Website) window.Website.plugins.firebase = FirebasePlugin;
module.exports = FirebasePlugin;