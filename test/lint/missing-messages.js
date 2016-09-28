// @flow

const test = require('tape')

const {fileAnalysis} = require('../../lib/visitors/types')
const getMissingMessagesErrors = require('../../lib/lint/missing-messages')

test('won\'t return errors if there are not messages', (t) => {
  t.deepEqual(getMissingMessagesErrors(fileAnalysis({}), []), [])
  t.deepEqual(getMissingMessagesErrors(fileAnalysis({messages: []}), []), [])
  t.end()
})

test('it should not complain if messages used in source are in the resource modules', (t) => {
  t.deepEqual(getMissingMessagesErrors(fileAnalysis({
    messages: ['banana', 'phone']
  }), [
    ['module1', { messages: ['banana', 'phone'] }],
    ['module2', { messages: ['banana', 'phone'] }]
  ]), [])
  t.end()
})

test('it should list by message used in source in which resource modules it is not specified', (t) => {
  const m1 = ['module1', { messages: ['banana', 'phone'] }]
  const m2 = ['module2', { messages: ['phone'] }]
  const m3 = ['module3', { messages: ['banana'] }]
  const m4 = ['module4', { messages: ['phone', 'ring'] }]

  t.deepEqual(getMissingMessagesErrors(fileAnalysis({
    messages: ['banana', 'phone']
  }), [m1, m2, m3, m4]), [
    { message: 'banana', modules: [m2, m4] },
    { message: 'phone', modules: [m3] }
  ])
  t.end()
})

test('it should list properly even when messages is a weird object instead of an array', (t) => {
  const m1 = ['module1', {
    messages: {
      '0': 'phone',
      '1': 'ring',
      'banana': function () {}
    }
  }]
  t.deepEqual(getMissingMessagesErrors(fileAnalysis({
    messages: ['banana', 'phone', 'apple']
  }), [m1]), [
    { message: 'apple', modules: [m1] }
  ])
  t.end()
})
