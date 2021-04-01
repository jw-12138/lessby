const { program } = require('commander')

program.version('1.0.0')
program
  .option('-i, --input', 'input less file')
  .option('-o, --output', 'output less file').parse()

const options = program.opts()

if(options.input){

}
