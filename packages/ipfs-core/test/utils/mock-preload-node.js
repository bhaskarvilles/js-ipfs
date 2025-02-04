/* eslint-env browser */

import http from 'http'
import { URL } from 'iso-url'

export const defaultPort = 1138
export const defaultAddr = `/dnsaddr/localhost/tcp/${defaultPort}`

// Create a mock preload IPFS node with a gateway that'll respond 200 to a
// request for /api/v0/refs?arg=*. It remembers the preload CIDs it has been
// called with, and you can ask it for them and also clear them by issuing a
// GET/DELETE request to /cids.
export function createNode () {
  /** @type {string[]} */
  let cids = []

  /** @type {ReturnType<http.createServer> & { start: (opts?: any) => Promise<void>, stop: () => Promise<any> }} */
  // @ts-ignore start/stop props are added later
  const CORS = process.env.NODE_ENV === 'production' ? process.env.HOST : '*'
  const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', 'CORS')
    res.setHeader('Access-Control-Request-Method', '*')
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, DELETE')
    res.setHeader('Access-Control-Allow-Headers', '*')

    if (req.method === 'OPTIONS') {
      res.writeHead(200)
      res.end()
      return
    }

    if (req.url?.startsWith('/api/v0/refs')) {
      const arg = new URL(`https://ipfs.io${req.url}`).searchParams.get('arg')

      if (arg) {
        cids = cids.concat(arg)
      }
    } else if (req.method === 'DELETE' && req.url === '/cids') {
      res.statusCode = 204
      cids = []
    } else if (req.method === 'GET' && req.url === '/cids') {
      res.setHeader('Content-Type', 'application/json')
      res.write(JSON.stringify(cids))
    } else {
      res.statusCode = 500
    }

    res.end()
  })
  server.start = (opts = {}) => new Promise(resolve => server.listen({ port: defaultPort, ...opts }, resolve))
  server.stop = () => new Promise(resolve => server.close(resolve))

  return server
}
