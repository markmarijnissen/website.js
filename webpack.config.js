var path = require('path');

module.exports = {
    entry: {
        'website': "./src/website",
        'website.plugins.http': "./src/plugins/http",
        'website.plugins.firebase': "./src/plugins/firebase",
        'website.plugins.firebase.rest': "./src/plugins/firebase.rest",
        'website.plugins.markdown':'./src/plugins/markdown',
        'website.plugins.template.dot':'./src/plugins/template.dot',
        'website.plugins.cache':'./src/plugins/cache',
        'website.plugins.render':'./src/plugins/render',
        'website.plugins.log':'./src/plugins/log',
    },
    resolve: {
    	alias: {
            'promise':'promiscuous',
    		'Promise':'promiscuous'
    	}
    },
    devServer: {
        publicPath: '/',
    },
    output: {
        path: path.join(__dirname, "dist"),
        filename: "[name].js",
    }
};