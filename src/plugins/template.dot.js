// see https://lodash.com/docs#template
var dot = require('dot/doT');
var toFilter = require('../utils/toFilter');

var TemplatePlugin = {
	created: function(options){
		if(!options.template) options.template = {};
		options.template.filter = toFilter(options.template.filter);
	},
	gotContent: function(id){
		if(this.options.template.filter(id)){
			this.content[id] = dot.template(this.content[id]);
			this.content[id].template = true;
		}
	},
	render: function(data){
		if(typeof data.content === 'object') {
			Object.keys(data.content).forEach(function(key){
				if(typeof data.content[key] === 'function' && data.content[key].template === true){
					data.content[key] = data.content[key](data);
				}
			});
		} else if(typeof data.content === 'function' && data.content.template === true){
			data.content = data.content(data);
		}
	}
}

if(window.Website) window.Website.plugins.template = TemplatePlugin;
module.exports = TemplatePlugin;