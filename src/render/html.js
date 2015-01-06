var getElement = require('../utils/getCachedElementById');

var HTMLRenderer = {
	render: function render(data) {
		if(data.title)	document.title = data.title;
		if(typeof data.content === 'string'){
			document.body.innerHTML = data.content;
		} else if(typeof data.content === 'object'){
			Object.keys(data.content)
				.map(function(id){
					var el = getElement(id);
					if(el) el.innerHTML = data.content[id];
				});
		}
	}
};

if(window.Website) window.Website.render.html = HTMLRenderer;
module.exports = HTMLRenderer;