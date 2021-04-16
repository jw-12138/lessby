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
          file = path.join(dir, file)
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
        .option('-i, --input <folder>', 'input less folder')
        .option('-o, --output <folder>', 'output less folder')
        .option('-e, --extension <ext>', "output file extension, eg. ' -e wxss '")
        .option('--mid-name <str>', "specify output file middle name, eg. ' --mid-name min '")
        .option('-r, --recursive', 'compile less files recursively')
        .option('-m, --minify', 'minify output file')
        .option('-s, --source-map', 'generate source map files')
        .option('--less-options <str>', 'specify original less-cli options, eg. \' --less-options "-l --no-color" \'')
      program.parse()

      this.options = program.opts()
    }

    this.run = function () {
      if (!_.options.input) {
        console.error('error: no input folder specified')
        shell.exit(1)
      }

      if (_.options.sourceMap) {
        _.param += '--source-map '
      }

      if (_.options.minify) {
        _.param += '--clean-css '
      }

      let fileList = []
      let rec_fun
      if (_.options.recursive) {
        rec_fun = _.walk
      } else {
        rec_fun = function (dir, c) {
          fs.readdir(dir, c)
        }
      }

      rec_fun(_.options.input, function (err, files) {
        files.forEach((file) => {
          if (path.extname(file) == '.less') {
            if (_.options.recursive) {
              fileList.push(file)
            } else {
              fileList.push(path.join(_.options.input, file))
            }
          }
        })
        call()
      })

      let call = function () {
        fileList.forEach((f) => {
          chok.watch(f).on('all', (event, path) => {
            if (event == 'add') {
              console.log(`lessby is watching [${path}], waiting for changes...`)
            }
            if (event == 'change') {
              log(`[🧭] [${path}] has changed, recompiling... `)
              _.defaultRun(path)
            }
          })
        })
      }
    }

    this.defaultRun = function (p) {
      let output_folder = path.dirname(p)
      let output_name = path.parse(p).name
      let lessOptions = _.options.lessOptions ? _.options.lessOptions : ''

      let rc_opf = null

      if (_.options.recursive) {
        let _i = path.normalize(_.options.input)
        let _o = path.normalize(_.options.output)
        let _p = path.normalize(p)

        rc_opf = path.dirname(_p.replace(_i, _o))
      }

      let e = _.options.extension ? _.options.extension : _.extension

      if (_.options.midName) {
        output_name = `${output_name}.${_.options.midName}`
      }
      let op = rc_opf ? `${rc_opf}/${output_name}.${e}` : `${output_folder}/${output_name}.${e}`
      let sh = `npx lessc ${lessOptions} ${_.param} "${p}" "${op}"`
      _.execShell(sh, p)
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
