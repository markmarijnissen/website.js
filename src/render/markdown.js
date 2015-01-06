var marked = require('marked');
var HTMLRenderer = require('./html');
var getElement = require('../utils/getCachedElementById');

var MarkdownRenderer = {
	gotContent: function(id,content){
		if(!this.options.markdown || !this.options.markdown.test || this.options.markdown.test(id)){
			this.content[id] = marked(content);
		}
	},
	render: HTMLRenderer.render
};

if(window.Website) window.Website.render.markdown = MarkdownRenderer;
module.exports = MarkdownRenderer;