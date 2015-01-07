function http(url,json,cb) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url);
  xhr.onreadystatechange = function(cb) {
   if (xhr.readyState == 4 && cb) {
      var data;
      if(json){
          try {
            data = JSON.parse(xhr.responseText);
          } catch (e) {}
        } else {
          data = xhr.responseText;
        }
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

var HttpPlugin = {
  created: function(options){
    this.options.contentExt = this.options.contentExt || '';
    var baseUrl = this.options.contentUrl;
    if(baseUrl[baseUrl.length-1] !== '/') baseUrl += '/';
    this.options.contentUrl = baseUrl;
  },
	getContentUrl: function(url){
		if(!url || url === '/') url = 'index';
		if(url[0] === '/') url = url.substr(1);
		return this.options.contentUrl + url + this.options.contentExt;
	},
	getContent: function(id,callback){
		return http(this.api.getContentUrl.call(this,id),false,callback);
	},
	getData: function(callback){
		return http(this.options.dataUrl,true,callback);
	}
};

if(window.Website) window.Website.plugins.http = HttpPlugin;
module.exports = HttpPlugin;