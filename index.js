const { program } = require('commander')
const shell = require('shelljs')
const log = require('single-line-log').stdout

// if (!shell.which('less')) {
//   shell.echo(`
// This script reqiures \`less\` to be installed globally!
// try to run:

// npm install -g less
//   `)
//   shell.exit(1)
// }

program.version('1.0.0')
program.option('-i, --input', 'input less file').option('-o, --output', 'output less file')
program.parse()

const options = program.opts()

if (!options.input) {
  log(`No input file specified!`)
}

console.log(options)


