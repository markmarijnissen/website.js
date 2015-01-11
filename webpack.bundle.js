var path = require('path');

module.exports = {
    entry: [
        "./src/website",
        "./src/plugins/http",
        "./src/plugins/render",
        "./src/plugins/markdown",
        "./src/plugins/log"
    ],
    resolve: {
    	alias: {
    		'Promise':'promiscuous'
    	}
    },
    output: {
        path: path.join(__dirname, "dist"),
        filename: "website.bundle.js",
    }
};