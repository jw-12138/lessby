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
    this.watchList = []

    this.init = function () {
      this.initProgram()
    }
    
    this.initialBuildDone = []

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
        .option('-b, --initial-build', 'compile less files before watch')
        .option('--one-time', 'compile less files ony once')
        .option('-r, --recursive', 'compile less files recursively')
        .option('-m, --minify', 'minify output file')
        .option('-s, --source-map', 'generate source map files')
        .option('--source-map-inline', 'generate inline source map files')
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
  
      if (_.options.sourceMapInline) {
        _.param.replace('--source-map ', '')
        _.param += '--source-map-inline '
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
        if(err){
          console.log(err)
          if(!fs.lstatSync(_.options.input).isDirectory()){
            console.log('\n<-i> will only accept a folder, not a file!')
          }
          return
        }
        files.forEach((file) => {
          if (path.extname(file) === '.less' && !path.basename(file).startsWith('_')) {
            if (_.options.recursive) {
              _.watchList.push(path.normalize(file))
            } else {
              _.watchList.push(path.normalize(path.join(_.options.input, file)))
            }
          }
        })
  
        if(!_.options.oneTime){
          _.watchList.forEach(el => {
            console.log(`🙈 lessby is watching [${el}]`)
          })
        }
  
        if(_.options.initialBuild){
          console.log(`🙈 <-b, --initial-build> is passed, starting building...`)
        }
  
        let watcher = chok.watch(_.watchList).on('all', (event, path) => {
          if (event === 'add') {
            if(_.options.initialBuild){
              perf.start()
              _.getShell(path, function () {
                _.initialBuildDone++
                if(_.options.oneTime && _.initialBuildDone === _.watchList.length){
                  watcher.close().then(() => console.log('👋 bye'))
                }
              })
            }
          }
          if (event === 'change') {
            perf.start()
            log(`🙈[${path}] has changed, recompiling...`)
            _.getShell(path)
          }
        })
      })
    }
  
    /**
     * 拼接执行的脚本
     * @param {string} p - path
     * @param {function} cb - callback
     */
    this.getShell = function (p, cb) {
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
      _.execShell(sh, p, cb)
    }

    this.execShell = function (script, name, cb) {
      shell.exec(script, {silent:true}, function (code, stdout, stderr) {
        if (stderr) {
          console.log('\n\n' + stderr)
        } else {
          _.l('', name)
          cb && cb()
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
      console.log('\x1b[32m%s\x1b[0m',`✨ [${name}] ${s}`)
    }
  }
}

let app = new App()
app.init()
