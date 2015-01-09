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

function http(url,cb) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url);
  xhr.onreadystatechange = function() {
   if (xhr.readyState == 4 && cb) {
        var data = fix(JSON.parse(xhr.responseText));
        if(xhr.status === 200){
          cb(null,data);
        } else {
          cb(xhr.status,xhr);
        }
      }
  };
  xhr.send();
  return xhr;
}

var FirebaseRestPlugin = {
  created: function(options){
    if(!options.firebase || !options.firebase.content || !options.firebase.data){
      self.emit('dataError','no firebase url');
      self.emit('contentError','no firebase url');
      return;
    }
    if(options.firebase.content[options.firebase.content.length-1] !== '/') {
      options.firebase.content += '/';
    }
    if(options.firebase.data[options.firebase.data.length-1] === '/') {
      options.firebase.data = options.firebase.data.substr(0,options.firebase.data.length-1);
    }
  },
	getContent: function(id,callback){
		return http(this.options.firebase.content + safe(id) + '.json',callback);
	},
	getData: function(callback){
		return http(this.options.firebase.data + '.json',callback);
	}
};

if(window.Website) window.Website.plugins.firebase = FirebaseRestPlugin;
module.exports = FirebaseRestPlugin;