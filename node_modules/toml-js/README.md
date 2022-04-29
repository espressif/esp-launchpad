# Toml-js [![Build Status](https://secure.travis-ci.org/alexanderbeletsky/toml-js.png?branch=master)](http://travis-ci.org/alexanderbeletsky/toml-js)

Very slim, very fast, no dependencies, [TOML](https://github.com/mojombo/toml) parser implementation. Works both browser (plain and AMD) and node.js.

## Why?

[TOML](https://github.com/mojombo/toml) is a very convenient, INI-like storage file format, suitable for many types of applications and utilities.

## Running on browser

Install bower component,

```
    bower install toml-js
```

Add reference,

```html
    <script type="text/javascript" src="components/toml-js/toml.js"></script>
```

or AMD,

```html
    define(['libs/toml'], function (toml) {

    });
```

Run parser,

```js
    $.get('/config/settings.toml', function (data) {
        var config = toml.parse(data);
        console.log(config);
    });
```

Run dumper,

```js
    var stringData = toml.dump({owner: {name: "Tom Preston-Werner", organization: "GitHub"}});
```

## Running on node

Install npm package

```
    npm install toml-js
```

Run parser,

```js
    var fs = require('fs');
    var toml = require('toml-js');

    fs.readFile('example.toml', function (err, data) {
        var parsed = toml.parse(data);
        console.log(parsed);
    });
```

Run dumper,

```js
    var toml = require('toml-js');
    var stringData = toml.dump({owner: {name: "Tom Preston-Werner", organization: "GitHub"}});
```

## Contributing

You are very welcome. Please fork, update [tests](/test/spec/toml.spec.js), apply fix, build and submit the pull request.

## Supported version

Support provided for [v0.1.0](https://github.com/mojombo/toml/blob/master/versions/toml-v0.1.0.md) version of TOML (latest up to 25 Feb 2013).

## Credits

* @rossipedia - [toml-net](https://github.com/rossipedia/toml-net) for well-rounded test suite.

# Licence (MIT License)

Copyright (c) 2013 Alexander Beletsky

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
