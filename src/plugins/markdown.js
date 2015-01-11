var marked = require('marked');
var toFilter = require('../utils/toFilter');

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