// a   url 
function pegasus(url,json) {
  var xhr = new XMLHttpRequest();

  // Open url
  xhr.open('GET', url);

  // Store callbacks
  var cbs = [];

  // onSuccess handler
  // onError   handler
  // cb        placeholder to avoid using var, should not be used
  xhr.onreadystatechange = xhr.then = function(onSuccess, onError, cb) {

    // Test if onSuccess is a function or a load event
    if (onSuccess.call) cbs = [,onSuccess, onError];

    // Test if request is complete
    if (xhr.readyState == 4) {

      // index will be:
      // 0 if undefined
      // 1 if status is between 200 and 399
      // 2 if status is over
      cb = cbs[0|xhr.status / 200];

      // Safari doesn't support xhr.responseType = 'json'
      // so the response is parsed
      if (cb) {
        var data;
        if(json){
          try {
            data = JSON.parse(xhr.responseText);
          } catch (e) {}
        } else {
          data = xhr.responseText;
        }
        cb(data,xhr);
      }
    }
  };

  // Send
  xhr.send();

  // Return request
  return xhr;
}

var API = {
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
	getContent: function(id){
		return pegasus(this.api.getContentUrl.call(this,id));
	},
	getData: function(){
		return pegasus(this.options.dataUrl,true);
	}
};

if(window.Website) window.Website.api.http = API;
module.exports = API;