# Nor - a one-operator programming language

> 日本語のREADMEはこちらです: [README.ja.md](README.ja.md)

Nor is a structured programming language that only supports the "nor" operator.

## Demo
[Nor Playground](https://code4fukui.github.io/Nor/) - runtime on the web
[Nor on web](https://code4fukui.github.io/Nor/norweb.html) - embedded in HTML

## Features
- Only one operator: "nor"
- Supports variables, arrays, conditional statements, loops, and functions
- Can be run in a web browser or on the command line
- Includes a debugging app: [nor2js](https://code4fukui.github.io/Nor/nor2js.html)

## Requirements
None. Nor can be run on the web or in the Deno runtime.

## Usage
To run Nor on the web, include the web.js script and add a `<script type="text/nor">` block:

```html
<script type="module" src="https://code4fukui.github.io/Nor/web.js"></script>
<script type="text/nor">
print 1 nor 0
</script>
```

To run Nor on the command line using Deno:

```sh
deno -A https://code4fukui.github.io/Nor/cli.js examples/add.nor
```

## License
Nor is an open source project. The license is not specified.