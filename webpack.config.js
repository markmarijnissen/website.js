var path = require('path');

module.exports = {
    entry: {
        'website': "./src/website",
        'website.api.http': "./src/api/http",
        'website.api.firebase': "./src/api/firebase",
        'website.render.markdown':'./src/render/markdown'
    },
    resolve: {
    	alias: {
    		'Promise':'promiscuous'
    	}
    },
    output: {
        path: path.join(__dirname, "dist"),
        filename: "[name].js",
    }
};