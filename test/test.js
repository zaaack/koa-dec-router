import test from 'ava'
import app from './app'
import supertest from 'supertest'

const agent = supertest(app.listen())

test('simple', async t => {
  let res = await agent.get('/hello/ha').expect(200)
  t.is(res.text, 'Hello')
  res = await agent.get('/hello/method-name').expect(200)
  t.is(res.text, 'method name')
})

test('middleware', async t => {
  let res = await agent.get('/hello-mdws/ha').expect(200)
  t.is(res.text, 'ha method ctrl')
  res = await agent.get('/hello-mdws/hi').expect(200)
  t.is(res.text, 'hi ctrl')
})

test('inherit', async t => {
  let res = await agent.get('/api/inherit/ha').expect(200)
  t.is(res.text, 'ha method ctrl api')
  res = await agent.get('/api/inherit/inherit').expect(200)
  t.is(res.text, 'inherit ctrl api')
  res = await agent.get('/api/inherit/override').expect(200)
  t.is(res.text, 'ha ctrl api')
})

test('priority', async t => {
  let res = await agent.get('/priority/right/p1').expect(200)
  t.is(res.text, 'right p1')
  res = await agent.get('/priority/wrong/p1').expect(200)
  t.is(res.text, 'wrong')
})
