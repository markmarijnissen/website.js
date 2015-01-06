var marked = require('marked');

var getElement = require('./getElement');

function Render(data) {
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

// Auto install itself on ContentSite
Website.prototype.render = Render;
module.exports = Render;