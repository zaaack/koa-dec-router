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

@controller('/api')
class ApiController {
  @get('/inherit')
  async inherit(ctx) {
    ctx.body = 'inherit'
  }

  @get('/override')
  async override(ctx) {
    ctx.body = 'override'
  }

  @get()
  async methodName(ctx) {
    ctx.body = 'method name'
  }
}

@controller('/hello')
export default class HelloController {

  @get('/ha')
  async list(ctx) {
    ctx.body = 'Hello'
  }

  @get() // using sluggified function name
  async methodName(ctx) {
    ctx.body = 'method name'
  }
}
