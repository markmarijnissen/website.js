var API = {
	init: function(){
		// initialization logic, such as setting and validating options
	},
	getContent: function(id){
		throw new Error('API.getContent(id) not implemented!');
		// Show return a Promise which returns the HTML
	},
	getData: function(){
		throw new Error('API.getData() not implemented!');
		// Should return a Promise with all 'data'
	},
	onContentError: function(err){
		console.error('api.getContent(id) error:',err);
	},
	onDataError: function(err){
		console.error('api.getData() error:',err);
	}
};
module.exports = API;