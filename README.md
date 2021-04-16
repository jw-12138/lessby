[![lessby](https://github.com/jw-12138/lessby/actions/workflows/node.js.yml/badge.svg)](https://github.com/jw-12138/lessby/actions/workflows/node.js.yml)

[Lessby](https://github.com/jw-12138/lessby/) is a simple less file cli-compiler.

## Installation

```
npm i lessby -D
```

## Usage

``` 
Usage: lessby [options]

Options:
  -i, --input <folder>   input less folder
  -o, --output <folder>  output less folder
  -e, --extension <ext>  output file extension, eg. ' -e wxss '
  --mid-name <str>       specify output file middle name, eg. ' --mid-name min '
  -r, --recursive        compile less files recursively
  -m, --minify           minify output file
  -s, --source-map       generate source map files
  --less-options <str>   specify original less-cli options, eg. ' --less-options "-l --no-color" '
  -h, --help             display help for command
```

### `-i, --input <folder>`

`required`  
```
lessby -i <folder_name>
```

Normally, lessby will watch all the less files inside the input folder, this action is **non-recursive**.

### `-o, --output <folder>`

```
lessby -i <folder_name> -o <output_foler_name>
```

### `-e, --extension <ext>`

Seriously, it's not just CSS out there.

```
lessby -i <folder_name> -e wxss
```

This will compile all the less files into CSS files with `.wxss` extension. You can use whatever extension you want.

### `--mid-name <str>`

```
lessby -i <folder_name> -m --mid-name min
```

Script above will compile all the less files from `xxx.less` to `xxx.min.css`.

Since file extension names are customizable, I think I'll make the middle name part customizable too, you can compile non-minified files with the name `min` in the middle, even if it is not recommended, but hey! Here we are!

### `-r, --recursive`

FINALLY!!!  

A less compiler with recursive option!

```
lessby -i src -r
```

If `src/` has a sub-folder and it contains less files, lessby will find it, and kill it... i mean, compile it. seen the movie `TAKEN`? no? ok. nvm🌝

### `-m, --minify`

As mentioned above, this parameter minifies output files.

```
lessby -i src -r -m
```

### `-s, --source-map`

lessby will generate source map files, those little things are helpful when in development.

```
lessby -i src -s
```

### `--less-options <str>`

And finally, the original `lessc` options.  

Since this is an npm pack based on `lessc`, So I think it'll be good in case you need something I didn't cover.