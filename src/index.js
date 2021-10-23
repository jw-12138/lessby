#!/usr/bin/env node

const { program } = require('commander')
const chok = require('chokidar')
const fs = require('fs')
const path = require('path')
const shell = require('shelljs')
const log = require('single-line-log').stdout
const perf = require('execution-time')()
const readline = require('linebyline')
const extractPath = require('extract-path')
const { stringify } = require('querystring')

class App {
  constructor() {
    let _ = this
    
    // 程序参数全局对象
    this.options = null
    
    // 获取到的用户参数
    this.param = ''
    
    // less编译完成后的默认后缀
    this.extension = 'css'
    
    
    this.recursiveArr = []
    this.hasImportedFiles = false
    this.watchList = []
    
    // 引用的文件
    this.importedList = []

    this.init = function () {
      this.initProgram()
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
  
    /**
     * 设定程序参数
     */
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

      this.initParam()
    }
  
    /**
     * 初始化CLI
     */
    this.initParam = function () {
      if (!_.options.input) {
        console.error('error: no input folder specified')
        shell.exit(1)
      }

      if (!fs.existsSync(_.options.input)) {
        console.error('error: input folder does not exists, please create it first!')
        shell.exit(1)
      }

      if (_.options.sourceMap) {
        _.param += '--source-map '
      }

      if (_.options.minify) {
        _.param += '--clean-css '
      }

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
          if (path.extname(file) === '.less' && !path.basename(file).startsWith('_')) {
            if (_.options.recursive) {
              _.watchList.push(path.normalize(file))
            } else {
              _.watchList.push(path.normalize(path.join(_.options.input, file)))
            }
          }
        })
        
        _.getImported(_.watchList)
        
        _.watchList.forEach((f) => {
          chok.watch(f).on('all', (event, path) => {
            if (event === 'add') {
              console.log(`lessby is watching [${path}], waiting for changes...`)
            }
            if (event === 'change') {
              perf.start()
              log(`[*] [${path}] has changed, recompiling...`)
              _.getShell(path)
            }
          })
        })
      })
    }
  
    /**
     * 获取import的less文件
     * @param {object[]} list 在watch list中的less文件
     */
    this.getImported = function (list) {
      list.forEach((f) => {
        let importedFile = {
          parent: f
        }
        if (!fs.existsSync(f)) {
          return false
        }
        let rl = readline(f)

        rl.on('line', function (line, lineCount, byteCount) {
          if (!line.startsWith('@import ')) {
            return false
          }
          
          let _regex = new RegExp(/ \(reference\)/g)
          if(_regex.test(line)){
            console.log(`[${lineCount}: ${line}], skipping reference file...`)
            return false
          }
          
          extractPath(line, {
            validateFileExists: false
          }).then((p) => {
            importedFile.self = path.normalize(path.join(_.options.input, p))
            _.watchImported(importedFile)
            _.getImported([importedFile.self])
          })
        }).on('error', function (e) {
          console.log(e)
        })
      })
    }
  
    /**
     * 监听引用的文件，如果有修改则触发主文件重构
     * @param {object} importedFile
     */
    this.watchImported = function (importedFile) {
      let _self = importedFile.self
      let _parent = importedFile.parent
  
      chok.watch(_self).on('all', (event, path) => {
        if (event === 'add') {
          console.log(`lessby is watching imported file [${path}], waiting for changes...`)
        }
        if (event === 'change') {
          perf.start()
          log(`[*] [${path}] has changed, recompiling its parent file [${_parent}]...`)
          _.getShell(_parent)
        }
      })
    }
  
    /**
     * 拼接执行的脚本
     * @param {string} p - path
     */
    this.getShell = function (p) {
      let output_folder = _.options.output ? _.options.output : path.dirname(p)
      let output_name = path.parse(p).name
      let lessOptions = _.options.lessOptions ? _.options.lessOptions : ''

      let rc_opf = null

      if (_.options.recursive) {
        let _i = path.normalize(_.options.input)
        let _o = path.normalize(_.options.output ? _.options.output : _i)
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
      shell.exec(script, {silent:true}, function (code, stdout, stderr) {
        if (stderr) {
          console.log('\n\n' + stderr)
        } else {
          _.l('', name)
        }
      })
    }
  
    /**
     * log到终端
     * @param {string} str
     * @param {string} name - full file name
     */
    this.l = function (str, name) {
      let t = perf.stop()
      let s = str ? str : `Compiled in ${parseInt(t.time)}ms.`
      console.log('')
      console.log('\x1b[32m%s\x1b[0m',`[√] [${name}] ${s}`)
    }
  }
}

let app = new App()
app.init()
