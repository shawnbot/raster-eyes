# raster-eyes
Raster Eyes is a Node library for taking screenshots of web pages using
[PhantomJS], a headless web browser built on top of the [WebKit] rendering
engine. It can be used as a [fallback renderer] for old and/or broken browsers,
or those with JavaScript disabled.

## Installation
Install with [npm]:

```sh
npm install raster-eyes
```

## Server
```
Run the raster-eyes server.
Usage: raster-eyes [options]

Examples:
  node server.js --port 8100           run on port 8001
  node server.js --cache node-cache    use node-cache as the request cache


Options:
  --host   Listen on this hostname (default: 127.0.0.1)                         
  --port   Listen on this port (default: 9000)                                  
  --cache  Load this module as request cache.
           Alternatively: --cache.module=name --cache.option=option             
```

## API
First, require the `raster-eyes` node module:

```js
var re = require('raster-eyes');
```

### <a name="capture"></a> `re.capture(url, [options,] callback)`
Asynchronously takes a screenshot of the given `url` using the following
possible options:

* `viewport`: the viewport rectangle, expressed either as a string
  `{width}x{height}` or an object with `width` and `height` properties
  (default: `1024x768`).
* `cliprect`: the region of the page to capture, either in the string form
  `{left}x{top}x{width}x{height}` or an object with `left`, `top`, `width` and
  `height` properties.
* `delay`: how many milliseconds to wait before capturing (default: `250`).
* `zoom`: the zoom factor (default: `1`)

### Web Services: `re.web`
The `raster-eyes` module's `web` namespace contains two functions for turning
`re.capture()` into web services:

#### <a name="server"></a> `re.web.server(options, callback)`
Creates an [express] web server with the raster-eyes [middleware](#middleware)
and the following server-specific options:

* `host`: the host on which to listen (default: `127.0.0.1`, or
  `process.env.HOST`)
* `port`: the port on which to listen (default: `9000`, or `process.env.PORT`)
* `path`: the path at which to mount the capture [middleware](#middleware)
  (default: `/raster-eyes/`)

#### <a name="middleware"></a> `re.web.middleware(options)`
The raster-eyes middleware is an [express]-compatible GET request handler that
parses the path and query string for capture options and produces HTTP image
responses when all goes well (or `500` error responses when it doesn't). It
accepts the following options in addition to the the [capture](#capture)
options:

* `cache`: an optional cache object with the following methods, each of which
  should implement [node-style callbacks], e.g. [node-cache]:
  * `cache.get(key, callback)`
  * `cache.set(key, value, callback)`

##### URLs
Raster Eyes' middleware looks at URLs relative to the [mount point] and assumes
one of the following forms:

```
{url}?{options}
?url={url}&{options}
```

The first form allows you to just `GET /raster-eyes/google.com` from a server
with the default options, but if the URL you're trying to access has query
string parameters you'll need to escape it (e.g. with the `encodeURI()` global
function in most JavaScript environments) first, otherwise the query string
will be parsed as options for `re.capture()`. You'll need to use the second
form (passing the URL as the `url` query string parameter) if you wish to
provide any additional options.

##### URL Options
You can specify any of the options that [re.capture()](#capture) takes as a
query string parameter, e.g.:

```
google.com?viewport=800x600
18f.gsa.gov?selector=.logo
```

[npm]: https://www.npmjs.com/
[PhantomJS]: phantomjs.org/
[WebKit]: http://www.webkit.org/
[express]: http://expressjs.com/
[node-cache]: https://www.npmjs.com/package/node-cache
[node-style callbacks]: http://thenodeway.io/posts/understanding-error-first-callbacks/
[mount point]: http://expressjs.com/4x/api.html#app.use
[fallback renderer]: https://github.com/shawnbot/raster-eyes/wiki/Raster-Eyes-as-browser-fallback-renderer
