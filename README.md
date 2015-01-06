website.js
----------

A static-site generator that runs in your browser

### Installation
```
npm install websitejs
bower install websitejs
```

### The Idea

**Website.js** does for you 

* Get the site metadata with the **API** (i.e. site config, sitemap and page metadata)
* Handle navigation
* Fetch content with the **API**
* And render the page with the **Renderer**

You can customize

* The API: How to fetch site metadata and content.
* The Renderer: How to render the page.

I've included two API's to fetch data:

* A HTTP API (Ajax)
* A Firebase API

And two simple Renderers:

* A HTML Renderer
* A Markdown Renderer (same as HTML, only parses Markdown first)

So if you have

* An `index.html` with a nice layout.
* A `site.json` to describe your site metadata.
* A few `page.md` for your page content.

Then you'll have a static site up and running in no time!

### Example

Run a static file server, then navigate to `/example`.
```
npm install node-static -g
static .
```

## Usage

1. Create a Website.s instance
2. Site Metadata (e.g. `site.json`)
3. The API (to fetch site metadata and content)
4. The Renderer (to render the page)
4. Website.js events

### 1. Create a Website 
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

// listen to website' evens (see below)
site.on(event,function(...){
	// `this` is the website instance
})
site.once(event,function);
site.off(event,function);

```

### 2. Site Metadata

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

### 3. The API

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

### 4. The Renderer
In the `pageMetadata`, content is defined as a string or object.

When defined as object, you have no strict 1-on-1 relationship between page and content. This allows your to create powerful rendering functions, as you can compose and reuse content througout the site.

The default Renderer (both HTML and Markdown) render as follows:

Given the following content:
```javascript
content = {
	"layout":"sidebar-layout.html",
	"sidebar":"navigation.html",
	"content":"blog-about-javascript.md"
}
```

* First, it inserts `sidebar-layout.html` in the #layout element.
* Then, it inserts `navigation.html` and the `blog-about-js.md` in the #sidebar and #content elements.

You can write a custom renderer as follows:

```javascript
var MyCustomRenderer = {
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

// later:
var website = new Website({render: MyCustomRenderer})
```

### 4. Website.js events

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
