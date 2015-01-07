var path = require('path');

module.exports = {
    entry: {
        'website': "./src/website",
        'website.plugins.http': "./src/plugins/http",
        'website.plugins.firebase': "./src/plugins/firebase",
        'website.plugins.markdown':'./src/plugins/markdown',
        'website.plugins.render':'./src/plugins/render',
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