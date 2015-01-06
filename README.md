website.js
----------

A static-site generator that runs in your browser

## The Idea

**website.js** handles 

* Fetch site metadata (i.e. site config, sitemap and page metadata)
* Fetch content
* Routing

You can customize

* The API: how to get site metadata and content
* The Renderer: how to render (i.e. you can add widgets, layouts, use jade, etc)

I've included

* A Firebase API - a realtime updating website
* A HTTP API (Ajax)
* A HTML Renderer (replaces elements in document with html content)
* A Markdown Renderer (same, only parses Markdown first)

So if you have

* An `index.html` with a fancy layout
* A `site.json` to describe your site metadata
* A few `page.md` for your page content

Then you'll have a static site up and running in no time!

## Installation
```
npm install websitejs
bower install websitejs
```

## Example

Run a static file server, then navigate to `/example`.
```
npm install node-static -g
static .
```

## Usage

You need to have

* Create a Website
* Write your Site Metadata (e.g. `site.json`)
* Use an API (to fetch site metadata and content)
* Use a Renderer (to render the page)

## Create a Website 
```javascript
var site = new Website({
	html5: true      // default true, if browser supports it
	base: '/example' // base url, all navigation is relative to this url
	api: { ... }     // An API to fetch data & content
	render: { ... }  // A Renderer to render your site
})

// navigate programatically to a url
site.navigate('/page1');

// re-render current url/route
site.refresh();

site.on(event,function(...){
	// `this` is the website instance
})
```

### Events

Enhance your website (content, rendering) by listening to events.

Events are fired roughly in the following sequence:

When creating new Website:

1. `created(options)`: When instantiating the Website
2. `gotDataForUrl(url,pageData)`: When `api.getData()` populates the sitemap, or when live-updating the sitemap with `website.setDataForUrl`.
3. `gotData(data)`: When `api.getData()` is finished.

When navigating:

1. `navigated(pageData)`: When router detected navigation
2. `gotContent(id,content)`: When `api.getContent(id)` returns new content
3. `before render(pageData)`: Before the render function is called
4. `rendered(pageData)`: After the render function is called
5. `renderer [url](pageData)`: After the render function is called.

When writing a custom API or Renderer, you can also listen to these events. Simply use the eventname as property. For example in the [MarkdownRenderer](https://github.com/markmarijnissen/website.js/blob/master/src/render/markdown.js):

```javascript
var MarkdownRenderer = {
	gotContent: function(id,content){
		this.content[id] = marked(content);
	},
	render: HTMLRenderer.render
};
```

**Live-update your website**
It's also possible to live-update your website. Firebase, for example, might live-update your website.

```javascript
// Live-update site content (refreshes if needed)
site.setContent('home','Hello world');

// Live-update page metadata (refreshes if needed)
site.setDataForUrl('/page1',{title:'Page 1', content:'page1'});
```

### Site Metadata

[Example](https://github.com/markmarijnissen/website.js/blob/master/example/site.json) site metadata:

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

* `data` must have a `sitemap`
* `sitemap` is a mapping from `url` to `pageMetadata`.
* `pageMetadata` must have `content`
* `content` points to a `contentId` in a String or Object.

### The API

When instantiating the Website, the Site Metadata will be fetched using the API.

When browsing the site, content is fetched as defined in `pageMetadata`.

```javascript
{
	getData: function(){
		// `this` is the Website instance
		// return a promise
	},
	getContent: function(id){
		// `this` is the Website instance
		// return a promise
	}

	// + optional event listeners (see below)
	created: function(options) { ... },
	rendered: function(pageMetadata) { ... },
	// and more..
}
```

### The Renderer
Upon navigating, the Renderer renders your page
```javascript
{
	render: function(pageMetadata){
		// `this` is the Website instance
		pageMetadata.url // route (normalized url)

		// url parameters
		pageMetadata.params

		// content (the contentId has been replaced with acutal content)
		pageMetadata.content
	}

	// + optional event listeners (see below)
	created: function(options) { ... },
	rendered: function(pageMetadata) { ... },
	// and more..
}
