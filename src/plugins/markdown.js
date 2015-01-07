var marked = require('marked');

var MarkdownPlugin = {
	gotContent: function(id,content){
		if(!this.options.markdown || !this.options.markdown.test || this.options.markdown.test(id)){
			this.content[id] = marked(content);
		}
	}
};

if(window.Website) window.Website.plugins.markdown = MarkdownPlugin;
module.exports = MarkdownPlugin;