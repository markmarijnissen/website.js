website.js
----------

A static-site generator that runs in your browser

## The Idea

**website.js** handles 

* fetch site data (i.e. site config, sitemap and page metadata)
* fetch content
* routing

You can customize

* how to get site data (i.e. you can use Ajax, localStorage, firebase, etc)
* how to get content
* how to render (i.e. you can add widgets, layouts, use jade, etc)

I've included

* A simple markdown renderer
* A simple AJAX data and content fetcher

So if you have

* An `index.html` with a fancy layout
* A `site.json` to describe all your page metadata
* A few `page.md` for your page content

Then you'll have a static site up and running in no time!
