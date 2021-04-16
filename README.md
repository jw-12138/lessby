[![lessby](https://github.com/jw-12138/lessby/actions/workflows/node.js.yml/badge.svg)](https://github.com/jw-12138/lessby/actions/workflows/node.js.yml)

### known issues

1. `lessc` seems can't compile files that have spaces in their filename.

  ```bash
  npx lessc  "./test/test 1.less" "./test/test 1.css"
  # lessc: ENOENT: no such file or directory, open 'lessby/test/test'
  ```
