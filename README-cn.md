[![lessby](https://github.com/jw-12138/lessby/actions/workflows/node.js.yml/badge.svg)](https://github.com/jw-12138/lessby/actions/workflows/node.js.yml)

[lessby](https://github.com/jw-12138/lessby/) 是一个简单易用的less cli编译器

![Exsample](vid/sample.gif)

[English](README.md)

[Change log](CHANGELOG.md)

## 安装

```shell
npm i lessby -D
```

## 使用

``` text
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

---

### `-i, --input <folder>`

`required`

```shell
lessby -i <folder_name>
```

正常情况下，lessby会检测输入文件夹下所有less文件的改动，但是该不会递归检测子文件夹。

---

### `-o, --output <folder>`

less编译后输出css的文件夹，可选。默认情况下和编译的less处于同级目录，但是作者还是推荐less和css应该放在不同文件夹中。

```shell
lessby -i <folder_name> -o <output_foler_name>
```

---

### `-e, --extension <ext>`

如果你写微信小程序的话，这个参数会非常有用。

```shell
lessby -i <folder_name> -e wxss
```

你可以使用任意文件名后缀，只要你愿意。🤷‍♂️

---

### `--mid-name <str>`

文件的中间名

```shell
lessby -i <folder_name> -m --mid-name min
```

上述脚本会将 `xxx.less` 编译为 `xxx.min.css`。

---

### `-r, --recursive`

终于！！！

一个有递归编译选项的less编译器出现了！

```shell
lessby -i src -r
```

如果`src/`下面有子文件，而且该子文件夹中也有less文件的话，lessby就会对其进行编译。(在这就不开国际玩笑了...)

---

### `-m, --minify`

这项参数决定了编译出来的文件是否需要压缩。

```shell
lessby -i src -r -m
```

---

### `-s, --source-map`

lessby默认不生成`.map`文件，但是在开发阶段，这些文件会非常有用。

```shell
lessby -i src -s
```

---

### `--less-options <str>`

最后就是一个原始的`lessc`参数的选项。万一你需要`lessc`上的一些功能，而我又没有想到...🤷‍♂️
