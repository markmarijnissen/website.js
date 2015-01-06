var marked = require('marked');
var getElement = require('./getElement');

function Render(data) {
	var self = this;
	if(data.title)	document.title = data.title;
	if(typeof data.content === 'string'){
		document.body.innerHTML = marked(data.content);
	} else if(typeof data.content === 'object'){
		Object.keys(data.content)
			.forEach(function(id){
				var el = getElement(id);
				if(el) {
					// cache markdown
					if(!self.htmlContent) self.htmlContent = {};
					if(!self.htmlContent[id]) {
						self.htmlContent[id] = marked(data.content[id]);
					}
					el.innerHTML = self.htmlContent[id];
				}
			});
	}
}

// Auto install itself on ContentSite
Website.prototype.render = Render;
module.exports = Render;