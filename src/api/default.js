var API = {
	getData: function(){
		throw new Error('API.getData() not implemented!');
		// Should return a Promise with all 'data'
	},
	getContent: function(id){
		throw new Error('API.getContent(id) not implemented!');
		// Show return a Promise which returns the HTML
	}
};
module.exports = API;