import Router from 'koa-router'
import requireDirAll from 'require-dir-all'
import appDebug from 'debug'
const debug = appDebug('dec-router')
export const ROUTES = Symbol('routes')
export const CTRL_PATH = Symbol('rootPath')
export const MIDDLEWARES = Symbol('middlewares')
export const OPTIONS = Symbol('options')

function uniqBy(arr, fn) { // an override mode uniqBy, make sure sub class's route override super class's
  const map = {}
  arr.forEach(it => {
    map[fn(it)] = it
  })
  return Object.keys(map).map(k => map[k])
}

function slug(str) {
  return str.replace(/([A-Z])/g, ($$, $1) => {
    return '-' + $1.toLowerCase()
  })
}

const defaultOptions = {
  controllersDir: '',
  before: null,
  after: null,
  autoLoadControllers: true,
  router: new Router(),
  registerRoute (router, route) {
    router[route.method](route.path, ...route.middlewares)
  },
  loadControllers (options) {
    let routes = []

    function registerCtrl(Ctrl) {
      // only for classes has @controller
      if (
       Ctrl instanceof Function &&
       Ctrl.hasOwnProperty(CTRL_PATH) &&
       Ctrl[OPTIONS].expose
      ) {
        const ctrl = new Ctrl()
        routes = routes
         .concat((ctrl[ROUTES] || [])
         .map(route => {
           const middlewares = Ctrl[MIDDLEWARES]
             .concat(route.middlewares)
             .map(mw => mw.bind(ctrl))
           if (options.before) {
             middlewares.unshift(options.before)
           }
           if (options.after) {
             middlewares.splice(middlewares.length - 1, options.after)
           }
           return Object.assign({}, route, {
             path: route.opts.ignoreCtrlPath ? route.path : Ctrl[CTRL_PATH] + route.path,
             middlewares, // fix this,
           })
         }))
      }
    }

    requireDirAll(options.controllersDir, {
      recursive: true,
      map: ({ name, exports: Ctrl, filepath }) => {
        let Ctrls = []
        if (typeof Ctrl === 'function') {
          Ctrls.push(Ctrl)
        }
        Ctrls
          .concat(Object.keys(Ctrl).map(k => Ctrl[k]))
          .forEach(registerCtrl)
      },
    })
    uniqBy(routes, r => r.path) // override and unique
      .sort((a, b) => b.priority - a.priority).forEach(route => {
        debug(route.method, route.path, route.funcName, route.priority)
        options.registerRoute(options.router, route, options)
      })
  },
}

const defaultRouteOpts = {priority: 0, ignoreCtrlPath: false}

export function route (
  method = 'use',
  path = null, opts = defaultRouteOpts, ...args
) {
  switch (typeof path) {
    case 'function':
      args.unshift(opts)
      path = null
      break
    case 'object':
      opts = path
      path = null
      break
    case 'number':
      opts = { priority: opts }
      path = null
      break
    default:
  }
  switch (typeof opts) {
    case 'function':
      args.unshift(opts)
      opts = defaultRouteOpts
      break
    case 'number':
      opts = { priority: opts }
      break
    default:
  }
  return (target, name) => {
    const routes = target[ROUTES] || []
    if (path === null) {
      path = '/' + slug(target[name].name) // using method name
    }
    opts = Object.assign({}, defaultRouteOpts, opts)
    async function handler(ctx, next) {
      const func = target[name]
      func.middlewares = args // for override access
      await func.call(this, ctx, next)
    }
    routes.push({
      method,
      path,
      opts,
      priority: opts.priority,
      funcName: name,
      middlewares: args.concat([handler]),
    })
    target[ROUTES] = routes
  }
}

export const get = (...args) => route('get', ...args)
export const head = (...args) => route('head', ...args)
export const post = (...args) => route('post', ...args)
export const put = (...args) => route('put', ...args)
export const del = (...args) => route('delete', ...args)
export const patch = (...args) => route('patch', ...args)
export const all = (...args) => route('use', ...args)

const defaultCtrlOpts = {
  ignoreParentPath: false,
  ignoreParentMdws: false,
  expose: true, // false won't create routes
}

export function controller (
  path = '/', opts = defaultCtrlOpts, ...args
) {
  switch (typeof path) {
    case 'function':
      args.unshift(opts)
      path = null
      break
    case 'object':
      opts = path
      path = null
      break
    default:
  }
  if (typeof opts === 'function') {
    args.unshift(opts)
    opts = defaultCtrlOpts
  }
  opts = Object.assign({}, defaultCtrlOpts, opts)
  return cls => {
    if (path === null) {
      path = '/' + slug(cls.name) // using class name
    }
    const father = Object.getPrototypeOf(cls)
    const fatherCtrlPath = opts.ignoreParentPath
      ? ''
      : (father[CTRL_PATH] || '')
    const fatherCtrlMws = opts.ignoreParentMdws
      ? []
      : (father[MIDDLEWARES] || [])
    cls[CTRL_PATH] = fatherCtrlPath + path // for controller inherit
    cls[MIDDLEWARES] = fatherCtrlMws.concat(args)
    cls[OPTIONS] = opts
  }
}

export default function (opts) {
  const options = Object.assign({}, defaultOptions, opts)
  if (options.autoLoadControllers) {
    options.loadControllers(options)
  }
  return options
}
