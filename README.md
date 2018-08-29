# q-method
Life is too short to wait for "ready" callbacks. Q up method calls and execute when ready.

```javascript
const Q = require('q-method')

function Database (config) {
    this.connection = new DBConnection(config)
    this.connection.on('connect', () => {
        // execute all queued method calls and begin normal operation
        Q.ready(this)
    })
}

// wrap method definitions with Q to defer execution until Q.ready is called
Database.prototype.findUser = Q(function (userid) {
    return this.connection.query({userid})
})

// new Database() is "synchronous"
const DB = new Database()

// able to call methods on it immediately
DB.findUser('thelegend97').then(user => {
    console.log(user)
})
```

Q-methods return Promises that will eventually resolve once the resource is ready. After the
resource is ready, methods execute as written. From the caller's perspective, the behavior is
the same before and after `Q.ready` is called, always returning a Promise.

Wrapped methods must be async functions or return a Promise or Promise-like object.

## API

### `Q(Function method)`

Wraps a method to be queued or executed. Takes a method that returns a Promise and returns a
method that returns a Promise.

### `Q.ready(Instance instance)`

Marks an instance as "ready", executing all queued method calls. Changes behavior of subsequent
method calls to be invoked immediately rather than queued.

### `Q.wait(Instance instance)`

Unmarks an instance as "ready", changing behavior back to queueing until `Q.ready` is called
again.

### `Q.isReady(Instance instance)`

Returns `true` if an instance is marked as "ready" or `false` if it is waiting.

## Contact

Bug reports, feature requests, and questions are all welcome: open a GitHub issue and I'll get back to you.
