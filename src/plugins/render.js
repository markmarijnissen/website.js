var getElement = require('../utils/getCachedElementById');

var RenderPlugin = {
	render: function render(data) {
		if(data.title)	{
			document.title = data.title;
		}
		if(typeof data.content === 'string'){
			document.body.innerHTML = data.content;
		} else if(typeof data.content === 'object'){
			var keys = Object.keys(data.content);
			var layoutIndex = keys.indexOf('layout');
			if(layoutIndex >= 0){
				keys.splice(layoutIndex,1);
				keys.unshift('layout');
			}
			keys.map(function(id){
					var el = getElement(id);
					if(el) el.innerHTML = data.content[id];
				});
		}
	}
};

if(window.Website) window.Website.plugins.render = RenderPlugin;
module.exports = RenderPlugin;