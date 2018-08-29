const test = require('tape')

const Q = require('../')

/*********
 * Setup *
 *********/

// the "database"
function Database () {
	setTimeout(() => {
		this.db = {
			foo: () => Promise.resolve('foo'),
			bar: () => Promise.resolve('bar'),
			exploder: () => Promise.reject(new Error('kaboom!')),
		}
		Q.ready(this)
	}, 300)
}

Database.prototype.get = Q(function (key) {
	return this.db[key]()
})

Database.prototype.badGet = Q(function () {
	return null
})

function Fail (t) {
	return err => {
		t.fail('Unexpected error: ' + err.message)
		t.end()
	}
}

/*********
 * Tests *
 *********/

test('Expect immediately invoked method calls to resolve with correct values', t => {
	t.plan(4)

	const DB = new Database()

	DB.get('foo').then(foo => {
		t.equal(foo, 'foo')
	}).catch(t.error)
	DB.get('bar').then(bar => {
		t.equal(bar, 'bar')
	}).catch(t.error)

	t.equal(Array.isArray(Q._map.get(DB)), true, 'methods were queued')
	t.equal(Q._map.get(DB).length, 2, 'all methods were queued')
})

test('Expect immediately invoked method calls to resolve correctly (async)', async t => {
	const DB = new Database()

	try {
		const bar = DB.get('bar')
		const foo = DB.get('foo')
		t.equal(await bar, 'bar')
		t.equal(await foo, 'foo')
	} catch (err) {
		t.error(err)
	}

	t.end()
})

test('Method calls should be chainable', t => {
	const DB = new Database()

	DB.get('foo').then(foo => {
		t.equal(foo, 'foo')
		return DB.get('bar')
	}).then(bar => {
		t.equal(bar, 'bar')
		t.end()
	}).catch(Fail(t))
})

test('Expect methods invoked after Q.ready to resolve correctly', t => {
	const DB = new Database()

	setTimeout(() => {
		t.equal(Q.isReady(DB), true)
		DB.get('foo').then(foo => {
			t.equal(foo, 'foo')
			t.end()
		}).catch(Fail(t))
	}, 600)
})

test('Expect errors to propogate out of queued method calls', t => {
	const DB = new Database()

	DB.get('exploder').then(() => {
		t.fail('This test should throw an error')
		t.end()
	}).catch(err => {
		t.equal(err.message, 'kaboom!', 'Caught expected error')
		t.end()
	})
})

test('Expect Q to throw an error if a non-promise-returning function is wrapped', t => {
	const DB = new Database()

	DB.badGet().then(() => {
		t.fail('This test should throw an error')
	}).catch(err => {
		t.equal(err.message.includes('Promise'), true, 'Error message mentions Promises')
		return DB.badGet()
	}).then(() => {
		t.fail('This test should throw an error')
		t.end()
	}).catch(err => {
		t.equal(err.message.includes('Promise'), true, 'Error message mentions Promises (after Q.ready)')
		t.end()
	})
})

test('Expect Q.wait to resume queueing, yet return correct results', t => {
	const DB = new Database()

	setTimeout(() => {
		Q.wait(DB)
		t.equal(Q.isReady(DB), false)

		DB.get('foo').then(foo => {
			t.equal(foo, 'foo')
			t.end()
		}).catch(Fail(t))

		Q.ready(DB)
	}, 600)
})
