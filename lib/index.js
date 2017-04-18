'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.all = exports.patch = exports.del = exports.put = exports.post = exports.head = exports.get = exports.OPTIONS = exports.MIDDLEWARES = exports.CTRL_PATH = exports.ROUTES = undefined;

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

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

const debug = (0, _debug2.default)('dec-router');
const ROUTES = exports.ROUTES = (0, _symbol2.default)('routes');
const CTRL_PATH = exports.CTRL_PATH = (0, _symbol2.default)('rootPath');
const MIDDLEWARES = exports.MIDDLEWARES = (0, _symbol2.default)('middlewares');
const OPTIONS = exports.OPTIONS = (0, _symbol2.default)('options');

function uniqBy(arr, fn) {
  // an override mode uniqBy, make sure sub class's route override super class's
  const map = {};
  arr.forEach(it => {
    map[fn(it)] = it;
  });
  return (0, _keys2.default)(map).map(k => map[k]);
}

function slug(str) {
  return str.replace(/([A-Z])/g, ($$, $1) => {
    return '-' + $1.toLowerCase();
  });
}

const defaultOptions = {
  controllersDir: '',
  before: null,
  after: null,
  autoLoadControllers: true,
  router: new _koaRouter2.default(),
  registerRoute(router, route) {
    router[route.method](route.path, ...route.middlewares);
  },
  loadControllers(options) {
    let routes = [];

    function registerCtrl(Ctrl) {
      // only for classes has @controller
      if (Ctrl instanceof Function && Ctrl.hasOwnProperty(CTRL_PATH) && Ctrl[OPTIONS].expose) {
        const ctrl = new Ctrl();
        routes = routes.concat((ctrl[ROUTES] || []).map(route => {
          const middlewares = Ctrl[MIDDLEWARES].concat(route.middlewares).map(mw => mw.bind(ctrl));
          if (options.before) {
            middlewares.unshift(options.before);
          }
          if (options.after) {
            middlewares.splice(middlewares.length - 1, options.after);
          }
          return (0, _assign2.default)({}, route, {
            path: route.opts.ignoreCtrlPath ? route.path : Ctrl[CTRL_PATH] + route.path,
            middlewares });
        }));
      }
    }

    (0, _requireDirAll2.default)(options.controllersDir, {
      recursive: true,
      map: ({ name, exports: Ctrl, filepath }) => {
        let Ctrls = [];
        if (typeof Ctrl === 'function') {
          Ctrls.push(Ctrl);
        }
        Ctrls.concat((0, _keys2.default)(Ctrl).map(k => Ctrl[k])).forEach(registerCtrl);
      }
    });
    uniqBy(routes, r => r.path) // override and unique
    .sort((a, b) => b.priority - a.priority).forEach(route => {
      debug(route.method, route.path, route.funcName, route.priority);
      options.registerRoute(options.router, route, options);
    });
  }
};

const defaultRouteOpts = { priority: 0, ignoreCtrlPath: false };

function route(method = 'use', path = null, opts = defaultRouteOpts, ...args) {
  switch (typeof path) {
    case 'function':
      args.unshift(opts);
      path = null;
      break;
    case 'object':
      opts = path;
      path = null;
      break;
    case 'number':
      opts = { priority: opts };
      path = null;
      break;
    default:
  }
  switch (typeof opts) {
    case 'function':
      args.unshift(opts);
      opts = defaultRouteOpts;
      break;
    case 'number':
      opts = { priority: opts };
      break;
    default:
  }
  return (target, name) => {
    let handler = (() => {
      var _ref = (0, _asyncToGenerator3.default)(function* (ctx, next) {
        const func = target[name];
        func.middlewares = args; // for override access
        yield func.call(this, ctx, next);
      });

      return function handler(_x, _x2) {
        return _ref.apply(this, arguments);
      };
    })();

    const routes = target[ROUTES] || [];
    if (path === null) {
      path = '/' + slug(target[name].name); // using method name
    }
    opts = (0, _assign2.default)({}, defaultRouteOpts, opts);

    const route = {
      method,
      path,
      opts,
      priority: opts.priority,
      funcName: name,
      middlewares: args.concat([handler])
    };
    target[ROUTES] = routes.concat(route);
  };
}

const get = exports.get = (...args) => route('get', ...args);
const head = exports.head = (...args) => route('head', ...args);
const post = exports.post = (...args) => route('post', ...args);
const put = exports.put = (...args) => route('put', ...args);
const del = exports.del = (...args) => route('delete', ...args);
const patch = exports.patch = (...args) => route('patch', ...args);
const all = exports.all = (...args) => route('use', ...args);

const defaultCtrlOpts = {
  ignoreParentPath: false,
  ignoreParentMdws: false,
  expose: true };

function controller(path = '/', opts = defaultCtrlOpts, ...args) {
  switch (typeof path) {
    case 'function':
      args.unshift(opts);
      path = null;
      break;
    case 'object':
      opts = path;
      path = null;
      break;
    default:
  }
  if (typeof opts === 'function') {
    args.unshift(opts);
    opts = defaultCtrlOpts;
  }
  opts = (0, _assign2.default)({}, defaultCtrlOpts, opts);
  return cls => {
    if (path === null) {
      path = '/' + slug(cls.name); // using class name
    }
    const father = (0, _getPrototypeOf2.default)(cls);
    const fatherCtrlPath = opts.ignoreParentPath ? '' : father[CTRL_PATH] || '';
    const fatherCtrlMws = opts.ignoreParentMdws ? [] : father[MIDDLEWARES] || [];
    cls[CTRL_PATH] = fatherCtrlPath + path; // for controller inherit
    cls[MIDDLEWARES] = fatherCtrlMws.concat(args);
    cls[OPTIONS] = opts;
  };
}