// a   url (naming it a, beacause it will be reused to store callbacks)
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
        if(typeof data !== undefined){
          cb(data,xhr);
        } else {
          cb(null,xhr);
        }
      }
    }
  };

  // Send
  xhr.send();

  // Return request
  return xhr;
}

var API = {
  init: function(){
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

// Auto install itself on ContentSite
Website.prototype.api = API;
module.exports = API;