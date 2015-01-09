website.js
----------

A static-site generator that runs in your browser

### Installation
```
npm install websitejs
bower install websitejs
```

## The Idea

**website.js** manages the lifecycle of a webpage for you.

It handles

1. Getting website metadata (i.e. config, sitemap, page metadata)
2. Responding to URL changes (Router)
3. Fetching content (i.e. Markdown or HTML)
4. Rendering a page

Using plugins and events, **website.js** is super-flexible.

Available plugins:

* HTTP: Fetch website metadata and content using a XHR request (AJAX)
* Firebase: Fetch website metadata and content using Firebase (and live-update your site!)
* Firebase REST: Use the Firebase' REST API instead.
* Markdown: Convert content from Markdown into HTML
* Render: Insert HTML content into DOM-elements (using the element id)
* Log: Log all events that are triggered (debug)

There is one special plugin: The Core Plugin.

The Core Plugin handles the flow:

1. On `created(options)`, fetch the website data with `getData(callback)`
2. On `gotData(data)`, check `data.sitemap` for urls.
3. Trigger `gotDataForUrl(url,pageData)` for every url to populate the router.
4. When the router fires `navigated`,
5. `getContent(id,callback)` to fetch content
6. `gotContent(id)` to transform content
7. `render(pageData)` the page
8. `rendered(pageData)` do stuff after rendering
9. `rendered /your/url(pageData)` do stuff after rendering a specific URL.

## Getting Started

```javascript
var site = new Website({
	html5: true       // default true, if browser supports it
	base: '/example'  // base url, all navigation is relative to this url
	core: { ... }     // Override the core plugin (optional)
	plugins: [ ... ]  // Add plugins
})

 var site = new Website({
    router: {
        html5: false,			// default true, if browser supports it
        base: '/example',		// base url, all navigation is relative to this url
    },
	core: { ... }     			// Override the core plugin (optional)
    plugins: [
        Website.plugins.http,
        Website.plugins.firebase,
        Website.plugins.markdown,
        Website.plugins.render,
        Website.plugins.log
    ],
    // plugins often add more options!
})

// navigate programatically to a url
site.navigate('/page1');

// re-render current url/route
site.refresh();
```

## Events

Add logic by listening to events:

```javascript
	// listen to website' events (see below)
	site.on(eventName,function(...){
		// `this` is the website instance
	})
	site.once(eventName,function);
	site.off(eventName,function);
```

Events are fired roughly in the following sequence:

1. When creating new Website:
	1. `created(options)`
	2. `gotDataForUrl(url,pageData)`
	3. `gotData(data)`

2. When navigating:
	1. `navigated(url)`
	2. `gotContent(id)` - this is called for every id
	3. `render(pageData)`
	4. `rendered(pageData)`
	5. `renderer [url](pageData)`

## Plugins

A plugin is an object that listens to events. Simply use eventNames as attributes. For example, the MarkdownPlugin transforms content into markdown:

```javascript
var MarkdownPlugin = {
	gotContent: function(id){
		this.content[id] = marked(this.content[id]);
	},
	// render: function() { ... }
	// etc
};
```

In addition to the events, plugins allow two extra methods:

```javascript
{
	getData: function(callback){
		// fetch your data
		callback(err,data);
	},
	getContent: function(id,callback){
		// fetch your content
		callback(err,content)
	}
}
```

### Core Plugin

The Core Plugin handles the lifecycle of the website: On navigation, fetch and render content.

So you must specify the urls of your website, and what content to fetch for every url.

To do this, `getData` follows a convention:

1. `data.sitemap` contains a map from `url` to `pageData`. 
2. `pageData.content` is an string (contentId) or an object (`{name:contentId,name:contentId}`).
3. `render(pageData)` is called with page metadata, only contentId has been replaced with actual content.

You still need to provide plugins for
* `getData(callback)`
* `getContent(id,callback)`
* `render(pageData)`

Site metadata ([Example](https://github.com/markmarijnissen/website.js/blob/master/example/site.json)):

```javascript
var data = {
	sitemap: {
		'/page1': {
			title: 'Page 1',
			content: 'page1.md'
		},
		'/page2': {
			title: 'Page 2',
			content: {
				sidebar: 'sidebar.md',
				content: 'page2.md'
			}
		}
	}
	// + other site data
}
```

### HTTP Plugin

Configure http with a content and data url:

```javascript
	new Website({
       http: {
            content: location.origin + '/example/content/',
            data: location.origin + '/example/site.json',   
        }
    })
```

### Firebase Plugin

Configure Firebase with a content and data url:

```javascript
	new Website({
	    firebase: {
	        content: 'https://YOURFIREBASE.firebaseio.com/content/',
	        data: 'https://YOURFIREBASE.firebaseio.com/data/',   
	    }
    })
```

Firebase is comes in two flavours: Live and REST.

The plugin automatically creates a correct URL for the REST API (i.e. append `.json`).

Note: Firebase does not allow `.` or `/` in keys. Therefore, when saving data to firebase, you must use `-dot-` and `\`.
When retrieving the sitemap and content, these are automatically converted back to `.` and `/`.

### Render Plugin

Renders `pageData.content` as follows:

* For an object `{#elementId: content}`: Inserts content into element with #elementId
* For a string: Replace document.body with content

Note: The `#layout` element is always rendered first, allowing you to specify a layout first, then render blocks of content in that layout.

Example:
```javascript
content = {
	"layout":"sidebar-layout.html",
	"sidebar":"navigation.html",
	"content":"blog-about-javascript.md"
}
```

You can write a custom Render plugin as follows:

```javascript
var MyCustomRenderer = {
	render: function(pageMetadata){
		// `this` is the Website instance
		pageMetadata.url // route (normalized url)

		// url parameters
		pageMetadata.params

		// content (the contentId has been replaced with actual content)
		pageMetadata.content
	}
}

// later:
var website = new Website(plugins: [ MyCustomRenderer ] })
// or
website.addPlugin(MyCustomRenderer)
```

### Markdown Plugin

The Markdown Plugin parses all content as Markdown.

If you want, you can specify a filter (i.e. which content id need to use Markdown?)

```javascript
	new Website({
		// Filter using a string (content-id must contain this string)
	    markdown: '.md',
	    
	    // Filter with a Regex
	    markdown: /.md$/,

	    // Filter with a function
	    //
	    // imagine you have the following Site metedata:
	    // data.markdown = ['pagea','pageb']
	    markdown: function(id){
	    	return this.data.markdown.indexOf(id) >= 0; 
		}
    })
```

## Advanced features

```javascript
// live-update your site:
site.setData(data)
site.setDataForUrl(url,data)
site.setContent(id,content);

// Manually get data or content:
site.getData(callback), callback(err,data);
site.getContent(id,callback), callback(err,content);
site.getContent({name:id,name:id}), callback(err,{name:content,name:content})
```

## Changelog

**0.1.0 9/1/2015**

First release. Implementation and API are probably relatively stable now.

## Contribute

Feel free to contribute to this project in any way. The easiest way to support this project is by giving it a star.

## Contact
-   @markmarijnissen
-   http://www.madebymark.nl
-   info@madebymark.nl

© 2014 - Mark Marijnissen