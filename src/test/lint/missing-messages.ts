import test = require('tape')

import {fileAnalysis} from '../../visitors/types'
import getMissingMessagesErrors from '../../lint/missing-messages'

test('won\'t return errors if there are not messages', (t) => {
  t.deepEqual(getMissingMessagesErrors(fileAnalysis({}), [], {}), [])
  t.deepEqual(getMissingMessagesErrors(fileAnalysis({messages: []}), [], {}), [])
  t.end()
})

test('it should not complain if messages used in source are in the resource modules', (t) => {
  const m = { messages: ['banana', 'phone'] }
  t.deepEqual(getMissingMessagesErrors(fileAnalysis({
    messages: ['banana', 'phone']
  }), [
    ['module1', m],
    ['module2', m]
  ], {
    'module1': m,
    'module2': m
  }), [])
  t.end()
})

test('it should list by message used in source in which resource modules it is not specified', (t) => {
  const m1 = { messages: ['banana', 'phone'] }
  const m2 = { messages: ['phone'] }
  const m3 = { messages: ['banana'] }
  const m4 = { messages: ['phone', 'ring'] }

  t.deepEqual(getMissingMessagesErrors(
    fileAnalysis({ messages: ['banana', 'phone'] }),
    [
      ['m1', m1],
      ['m2', m2],
      ['m3', m3],
      ['m4', m4]
    ],
    {m1, m2, m3, m4}
  ), [
    { message: 'banana', modules: [['m2', m2], ['m4', m4]] },
    { message: 'phone', modules: [['m3', m3]] }
  ])
  t.end()
})

test('it should list properly even when messages is a weird object instead of an array', (t) => {
  const m1 = {
    messages: {
      '0': 'phone',
      '1': 'ring',
      'banana': function () {}
    }
  }
  t.deepEqual(getMissingMessagesErrors(fileAnalysis({
    messages: ['banana', 'phone', 'apple']
  }), [['m1', m1]], {m1}), [
    { message: 'apple', modules: [['m1', m1]] }
  ])
  t.end()
})

test('it should not complain if messages used in source are in a dependency in resource modules', (t) => {
  const m1 = { dependencies: ['module2'] }
  t.deepEqual(getMissingMessagesErrors(fileAnalysis({
    messages: ['banana', 'phone']
  }), [
    ['module1', m1]
  ], {
    'module1': m1,
    'module2': { messages: ['banana', 'phone'] }
  }), [])
  t.end()
})
