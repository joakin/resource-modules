const test = require('tape')

const getDependenciesErrors = require('../../lib/lint/dependencies')

test('won\'t return errors if there are no requires', (t) => {
  t.equal(getDependenciesErrors({}), undefined)
  t.equal(getDependenciesErrors({requires: []}), undefined)
  t.end()
})

test('it should not complain if required dep in source is defined in a previous file in the same module', (t) => {
  const m1 = {
    scripts: [
      'f2',
      'f1'
    ]
  }
  const f1 = { requires: ['mobile.browser/Browser'] }
  const f2 = { defines: ['mobile.browser/Browser'] }

  t.deepEqual(getDependenciesErrors(
    f1,
    [ // In modules
      ['m1', m1]
    ],
    { // Analysis from source
      files: { f1, f2 }
    },
    'f1',
    { // resource modules
      m1
    }
  ), [])

  t.end()
})

test('it should complain if required dep in source is not defined in a previous file in the same module', (t) => {
  const m1 = {
    scripts: [
      'f2',
      'f1'
    ]
  }
  const f1 = { requires: ['mobile.browser/Browser'] }
  const f2 = { defines: [] }

  t.deepEqual(getDependenciesErrors(
    f1,
    [ // In modules
      ['m1', m1]
    ],
    { // Analysis from source
      files: { f1, f2 }
    },
    'f1',
    { // resource modules
      m1: m1
    }
  ), [
    // Module not defined, where: any files
    { id: 'mobile.browser/Browser', kind: 'not_defined', where: [] }
  ])

  t.end()
})

test('it should not complain if required dep in source is defined in a dependency module', (t) => {
  const m1 = {
    dependencies: ['m2'],
    scripts: ['f1']
  }
  const m2 = {
    scripts: ['f2']
  }
  const f1 = { requires: ['mobile.browser/Browser'] }
  const f2 = { defines: ['mobile.browser/Browser'] }

  t.deepEqual(getDependenciesErrors(
    f1,
    [ // In modules
      ['m1', m1]
    ],
    { // Analysis from source
      files: { f1, f2 }
    },
    'f1',
    { // resource modules
      m1, m2
    }
  ), [])

  t.end()
})

test('it should not complain if required dep in source is defined in a nested dependency module', (t) => {
  const m1 = {
    dependencies: ['m2'],
    scripts: ['f1']
  }
  const m2 = {
    dependencies: ['m3']
  }
  const m3 = {
    scripts: ['f2']
  }
  const f1 = { requires: ['mobile.browser/Browser'] }
  const f2 = { defines: ['mobile.browser/Browser'] }

  t.deepEqual(getDependenciesErrors(
    f1,
    [ // In modules
      ['m1', m1]
    ],
    { // Analysis from source
      files: { f1, f2 }
    },
    'f1',
    { // resource modules
      m1, m2, m3
    }
  ), [])

  t.end()
})

test('it should complain if required dep in source is not defined in a nested dependency module', (t) => {
  const m1 = {
    dependencies: ['m2'],
    scripts: ['f1']
  }
  const m2 = {
    dependencies: ['m3']
  }
  const m3 = {
    scripts: []
  }
  const f1 = { requires: ['mobile.browser/Browser'] }
  const f2 = { defines: ['mobile.browser/Browser'] }

  t.deepEqual(getDependenciesErrors(
    f1,
    [ // In modules
      ['m1', m1]
    ],
    { // Analysis from source
      files: { f1, f2 }
    },
    'f1',
    { // resource modules
      m1, m2, m3
    }
  ), [ // Required module not found, defined in file f2
    { id: 'mobile.browser/Browser', kind: 'not_found', where: 'f2' }
  ])

  t.end()
})
