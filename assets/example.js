// Add this at the beginning of your node.js entry file
require('friendly-error')({
  proxy: 'socks5://localhost:1080'
})

const http = require('http')
const server = http.createServer()

server.listen(9000)
