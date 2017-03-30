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

@controller('/hello-mdws', ctrlMdw)
export default class HelloController {

  @get('/ha', methodMdw)
  async list(ctx) {
    ctx.body = 'ha'
  }

  @get('/hi')
  async hi(ctx) {
    ctx.body = 'hi'
  }
}
