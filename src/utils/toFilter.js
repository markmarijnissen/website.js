module.exports = function toFilter(filter){
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