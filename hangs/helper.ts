import { randomBytes } from 'crypto'
import { makeFetch } from 'supertest-fetch'
import { App } from '@tinyhttp/app'
import type { Request, Response } from '@tinyhttp/app'
import { cookieParser } from '@tinyhttp/cookie-parser'
import session from 'express-session'
import { urlencoded, json } from 'milliparsec'
import { csrf } from 'malibu'
import type { CSRFOptions, CSRFRequest } from 'malibu'

type ParserOptions = 'urlencoded' | 'json' | ''
type MiddlewareOptions = 'cookie' | 'signedCookie' | 'session'

interface initAppOptions {
  middleware?: MiddlewareOptions
  parser?: ParserOptions
  options?: CSRFOptions
}

const secret = randomBytes(32).toString('base64')

export function initApp({ parser, options = {}, middleware = 'cookie' }: initAppOptions) {
  const app = new App<any, Request & CSRFRequest, Response>()
  const csrfProtection = csrf(parseOptions(options, middleware))

  if (parser === 'urlencoded') {
    app.use(urlencoded())
  } else if (parser === 'json') {
    app.use(json())
  }

  if (middleware === 'cookie') {
    app.use(cookieParser())
  } else if (middleware === 'signedCookie') {
    app.use(cookieParser(secret))
  } else if (middleware === 'session') {
    // @ts-ignore
    app.use(session({ secret, resave: false, saveUninitialized: false, name: 'session' }))
  }

  app.get('/', csrfProtection, (req, res) => {
    res.status(200).json({ token: req.csrfToken() })
  })

  app.post('/', csrfProtection, (_, res) => {
    res.status(200).json({ message: 'hello' })
  })

  const server = app.listen()
  const fetch = makeFetch(server)

  return { fetch, app, server }
}

function parseOptions(options: CSRFOptions, middleware: MiddlewareOptions) {
  if (Object.keys(options).length === 0 && middleware === 'signedCookie') {
    return { cookie: { signed: true } }
  }
  return options
}