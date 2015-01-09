var marked = require('marked');

function toFilter(filter){
	if(typeof filter === 'string'){
		return function(id){
			return id.indexOf(filter) >= 0;
		};
	} else if(filter && filter.test){
		return function(id){
			return filter.test(id);
		};
	} else if(typeof filter === 'function'){
		return filter;
	} else {
		return function() { 
			return true; 
		};
	}
}

var MarkdownPlugin = {
	created: function(options){
		this.markdownFilter = toFilter(options.markdown);
	},
	gotContent: function(id,content){
		if(this.markdownFilter(id)){
			this.content[id] = marked(this.content[id]);
		}
	}
};

if(window.Website) window.Website.plugins.markdown = MarkdownPlugin;
module.exports = MarkdownPlugin;