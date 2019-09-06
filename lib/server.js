let Characteristic

const http = require('http')

const returnState = (accessory, res) => {
  accessory.getCurrentState(function(err, currentState, currentTargetState) {
    if (err) {
      res.statusCode = 500
      res.write(`${err}`)
      res.end()
      return
    }

    res.end(`{"current": ${currentState}, "target": ${currentTargetState}}`)
  })
}

/**
 * Server for setting the garage door state
 *
 * GET /state   - Returns the current state as recorded by the GDSwitch
 * PUT /open    - Set the state to open
 * PUT /closed  - Set the state to closed
 *
 * @param {GDSwitch} accessory The GDSwitch to control with this server
 */
const createServer = (accessory) => {
  const server = http.createServer((req, res) => {
    if (req.url === '/state') {
      returnState(accessory, res)
    } else if (req.url === '/open' && req.method === 'PUT') {
      accessory.setCurrentState(0)
      returnState(accessory, res)
    } else if (req.url === '/closed' && req.method === 'PUT') {
      accessory.setCurrentState(1)
      returnState(accessory, res)
    } else {
      res.statusCode = 404
      res.end(`{"error": "No URL endpoint for ${req.method} ${req.url}"}`)
    }
  })

  server.listen(accessory.httpPort)
  if (accessory.debug) accessory.log(`Server listening on ${accessory.httpPort}`)
}

module.exports = {
  createServer
}
