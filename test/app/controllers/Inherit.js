import { controller, get, post } from '../../../src'

async function apiMdw(ctx, next) {
  await next()
  ctx.body += ' api'
}

async function ctrlMdw(ctx, next) {
  await next()
  ctx.body += ' ctrl'
}

async function methodMdw(ctx, next) {
  await next()
  ctx.body += ' method'
}

// override only, won't expose routes like `/api/inherit`, `/api/override`, controller options cannot be inherit
@controller('/api', { expose: false }, apiMdw)
export class ApiController { // export class would create routes too.

  @get('/inherit')
  async inherit(ctx) {
    ctx.body = 'inherit'
  }

  @get('/override')
  async override(ctx) {
    ctx.body = 'override'
  }
}

@controller('/inherit', ctrlMdw)
export default class InheritController extends ApiController {

  @get('/ha', methodMdw)
  async list(ctx) {
    ctx.body = 'ha'
  }

  @get('/override') // override all in super's method (handler, middleares, options, etc.)
  async override(ctx) {
    ctx.body = 'ha'
  }
}
