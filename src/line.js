const readline = require('linebyline')
const extractPath = require('extract-path')

let rl = readline('./test/main.less')

rl.on('line', function (line, lineCount, byteCount) {
  if (!line.startsWith('@import ')) {
    return false
  }

  extractPath(line).then((path) => {
    console.log(path)
  })
}).on('error', function (e) {
  console.log(`line.js: ${e}`)
})
