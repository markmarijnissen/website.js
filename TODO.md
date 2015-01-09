# TODO

* unit tests
* editor

## Editor API

```javascript
editor = {
	setData: function(value) {},
	setDataForUrl: function(url,value){},
	setContent: function(id,content),
	files: {
		upload: function(source?,filename){
			// Promise that resolves with Path/URL (for link)
		},
		delete: function(filename){
			// Promise that resolves with true|false
		},
		list: function(){
			// Promise that resolves with [ /paths/url/to/files.js ]
		}
	}
}
```

Editor has different tabs
* Content Tabs = Markdown/HTML editor (+ image insert tool)
* File Tab = List/Upload/Delete (+View as thumb gallery or as list)
* Data Tab = (json tool for site config and metadata)
* sitemap Tab

Sitemap & Content have 2 columns: Left is list of urls/ids, right is editor.

editor.json
- specify tabs

- type = 'content': 'file': 'data': 'sitemap'
- editor = json | json-schema | html | markdown
- schema = the schema (optional)
(((- filter = how to filter content/sitemap
- sort = how to sort files/sitemap/content)))

Basic version:
- 'site' tab; JSON editor
- 'content' tab; List + Markdown editor

Extra
- 'sitemap' tab; List + JSON editor

Extra 2
- 'sitemap' tab + JSON Schema

Extra 3 (add PHP)
- 'files' tab, list + upload + remove

Extra 4
- timthumb
- image helper in markdown editor