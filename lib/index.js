'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.all = exports.patch = exports.del = exports.post = exports.get = exports.MIDDLEWARES = exports.CTRL_PATH = exports.ROUTES = undefined;

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _symbol = require('babel-runtime/core-js/symbol');

var _symbol2 = _interopRequireDefault(_symbol);

exports.route = route;
exports.controller = controller;

exports.default = function (opts) {
  const options = (0, _assign2.default)({}, defaultOptions, opts);
  if (options.autoLoadControllers) {
    options.loadControllers(options);
  }
  return options;
};

var _koaRouter = require('koa-router');

var _koaRouter2 = _interopRequireDefault(_koaRouter);

var _requireDirAll = require('require-dir-all');

var _requireDirAll2 = _interopRequireDefault(_requireDirAll);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const debug = (0, _debug2.default)('dec_route');
const ROUTES = exports.ROUTES = (0, _symbol2.default)('routes');
const CTRL_PATH = exports.CTRL_PATH = (0, _symbol2.default)('rootPath');
const MIDDLEWARES = exports.MIDDLEWARES = (0, _symbol2.default)('middlewares');

function uniqBy(arr, fn) {
  // an override mode uniqBy, make sure sub class's route override super class's
  const map = {};
  arr.forEach(it => {
    map[fn(it)] = it;
  });
  return (0, _keys2.default)(map).map(k => map[k]);
}

const defaultOptions = {
  controllersDir: '',
  router: new _koaRouter2.default(),
  registerRoute(router, route) {
    router[route.method](route.path, ...route.middlewares);
  },
  before: null,
  after: null,
  autoLoadControllers: true,
  autoCallNext: true,
  loadControllers(options) {
    let routes = [];
    (0, _requireDirAll2.default)(options.controllersDir, {
      recursive: true,
      map: ({ name, exports: Ctrl, filepath }) => {
        Ctrl = Ctrl.default || Ctrl;
        // only for classes has @controller
        if (Ctrl instanceof Function && Ctrl.hasOwnProperty(CTRL_PATH)) {
          const ctrl = new Ctrl();
          routes = routes.concat((ctrl[ROUTES] || []).map(route => {
            const middlewares = Ctrl[MIDDLEWARES].concat(route.middlewares).map(mw => mw.bind(ctrl));
            if (options.before) {
              middlewares.unshift(options.before);
            }
            if (options.after) {
              middlewares.push(options.after);
            }
            return (0, _assign2.default)({}, route, {
              path: Ctrl[CTRL_PATH] + route.path,
              middlewares });
          }));
        }
      }
    });
    uniqBy(routes, r => r.path) // 去重
    .sort((a, b) => a.sort - b.sort).forEach(route => {
      debug(route.method, route.path, route.funcName, route.sort);
      options.registerRoute(options.router, route, options);
    });
  }
};

const defaultRouteOpts = { sort: 0, autoNext: false };

function route(method = 'use', path = '/', opts = defaultRouteOpts, ...args) {
  return (target, name) => {
    const routes = target[ROUTES] || [];

    switch (typeof opts) {
      case 'function':
        args.unshift(opts);
        opts = defaultRouteOpts;
        break;
      case 'boolean':
        opts = { autoNext: opts };
        break;
      case 'number':
        opts = { sort: opts };
        break;
      default:
    }
    opts = (0, _assign2.default)({}, defaultRouteOpts, opts);
    async function handler(ctx, next) {
      const func = target[name];
      func.middlewares = args; // for override access
      await func.call(this, ctx, next);
      if (opts.autoNext) {
        await next();
      }
    }
    routes.push({
      method,
      path,
      opts,
      sort: opts.sort,
      funcName: name,
      middlewares: args.concat([handler])
    });
    target[ROUTES] = routes;
  };
}

const get = exports.get = (...args) => route('get', ...args);
const post = exports.post = (...args) => route('post', ...args);
const del = exports.del = (...args) => route('delete', ...args);
const patch = exports.patch = (...args) => route('patch', ...args);
const all = exports.all = (...args) => route('all', ...args);

function controller(path = '/', ...args) {
  return cls => {
    const father = (0, _getPrototypeOf2.default)(cls);
    const fatherCtrlPath = father[CTRL_PATH] || '';
    const fatherCtrlMws = father[MIDDLEWARES] || [];
    cls[CTRL_PATH] = fatherCtrlPath + path; // for controller inherit
    cls[MIDDLEWARES] = fatherCtrlMws.concat(args);
  };
}