#!/usr/bin/env node

const { program } = require('commander')
const chok = require('chokidar')
const fs = require('fs')
const path = require('path')
const shell = require('shelljs')
const log = require('single-line-log').stdout
const sha1 = require('sha1')

class App {
  constructor() {
    let _ = this

    this.options = null
    this.param = ''
    this.extension = 'css'
    this.recursiveArr = []
    this.loading_char = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖']
    this.loading_ani = 0

    this.init = function () {
      this.initProgram()
      this.run()
    }

    this.walk = function (dir, done) {
      var results = []
      fs.readdir(dir, function (err, list) {
        if (err) return done(err)
        var i = 0
        ;(function next() {
          var file = list[i++]
          if (!file) return done(null, results)
          file = path.resolve(dir, file)
          fs.stat(file, function (err, stat) {
            if (stat && stat.isDirectory()) {
              _.walk(file, function (err, res) {
                results = results.concat(res)
                next()
              })
            } else {
              results.push(file)
              next()
            }
          })
        })()
      })
    }

    this.initProgram = function () {
      program
        .option(`-i, --input <path>`, `input less file`)
        .option(`-o, --output <path>`, `output less file`)
        .option(`-if, --input-folder <path>`, `input folder`)
        .option(`-of, --output-folder <path>`, `output folder`)
        .option('-e, --extension <ext>', 'output file extension, eg. `css`, `wxss`')
        .option(`-R, --recursive`, `compile less files recursively`)
        .option(`-m, --minify`, `minify output file`)
        .option('-C, --config-file', 'specify config file')
        .option(`-s, --source-map`, `generate source map files`)
        .option(
          `-lo, --less-options <options>`,
          'specify original less-cli options, eg. "--source-map-url=URL -l --no-color"'
        )
      program.parse()

      this.options = program.opts()
    }

    this.run = function () {
      // console.log(_.options)

      if (_.options.sourceMap) {
        _.param += '--source-map '
      }

      if (_.options.minify) {
        _.param += '--clean-css '
      }

      chok.watch(_.options.input).on('all', (event, path) => {
        if (event == 'add') {
          console.log('lessby is currently on...')
        }
        if (event == 'change') {
          log(`[🧭] [${_.options.input}] has changed, recompiling... `)

          _.defaultRun()
        }
      })
    }

    this.defaultRun = function () {
      let input = _.options.input

      if (!_.inputIsfolder && path.extname(input) !== '.less') {
        return false
      }
      let output_folder = path.dirname(input)
      let output_name = path.basename(input).split('.').slice(0, -1).join('.')

      let e = _.options.extension ? _.options.extension : _.extension

      let sh = `npx lessc ${_.param} ${input} ${output_folder}/${output_name}.${e}`

      // console.log(sh)

      _.execShell(sh, input)
    }

    this.execShell = function (script, name) {
      shell.exec(script, function (code, stdout, stderr) {
        if (stderr) {
          console.log(stdout)
        } else {
          _.l('', name)
        }
      })
    }

    this.l = function (str, name) {
      let d = new Date().getTime()
      let cp_hash = sha1(d)
      let sp = cp_hash.slice(-6)
      let s = str ? str : `Compiled successfully! #[${sp}]`
      log(`[✅] [${name}]: ${s}`)
    }
  }
}

let app = new App()
app.init()
