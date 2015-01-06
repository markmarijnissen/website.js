var marked = require('marked');
var HTMLRenderer = require('./html');
var getElement = require('../utils/getCachedElementById');

var MarkdownRenderer = {
	gotContent: function(id,content){
		this.content[id] = marked(content);
	},
	render: HTMLRenderer.render
};

if(window.Website) window.Website.render.markdown = MarkdownRenderer;
module.exports = MarkdownRenderer;