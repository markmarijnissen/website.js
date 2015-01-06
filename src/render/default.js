var getElement = require('./getElement');

function Render(data) {
	if(meta.title)	document.title = data.title;
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

module.exports = Render;