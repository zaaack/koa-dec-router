import { controller, get, post } from '../../../src'

@controller('/priority')
export class PriorityController1 {

  @get('/right/*', {priority: -10})
  async right(ctx) {
    ctx.body = 'right'
  }

  @get('/wrong/*', {priority: 0}) // default priority is 0
  async wrong(ctx) {
    ctx.body = 'wrong'
  }
}

@controller('/priority')
export default class PriorityController2 {
  @get('/right/p1')
  async right(ctx) {
    ctx.body = 'right p1'
  }

  @get('/wrong/p1')
  async wrong(ctx) {
    ctx.body = 'wrong p1'
  }
}
