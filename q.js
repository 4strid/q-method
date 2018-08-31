function Q (method) {
	return function (...args) {
		let queue = Q._map.get(this)
		const ready = queue === true
		if (ready) {
			// immediately invoke method
			const p = method.call(this, ...args)
			if (!(p instanceof Object && 'then' in p)) {
				return Promise.reject(new TypeError('Q wrapped method must return a Promise'))
			}
			return p
		}
		if (queue === undefined) {
			// first method to be queued
			queue = []
			Q._map.set(this, queue)
		}
		return new Promise((resolve, reject) => {
			queue.push({
				method,
				args,
				resolve,
				reject,
			})
		})
	}
}

Q._map = new Map()

Q.ready = function (instance) {
	const queue = Q._map.get(instance)
	if (queue === undefined) {
		// no methods were ever queued, just mark as Ready
		return Q._map.set(instance, true)
	}
	if (Array.isArray(queue)) {
		// queue must be flushed
		Q._map.set(instance, true)
		for (let i = 0; i < queue.length; i++) {
			const q = queue[i]
			if (Q.isReady(instance)) {
				const p = q.method.call(instance, ...q.args)
				if (!(p instanceof Object && 'then' in p)) {
					q.reject(new TypeError('Q wrapped method must return a Promise'))
					continue
				}
				p.then(q.resolve).catch(q.reject)
			} else {
				Q._map.set(instance, queue.slice(i))
				break
			}
		}
	}
	// else instance is already ready, this has no effect
}

Q.wait = function (instance) {
	const ready = Q._map.get(instance)
	if (ready === true) {
		Q._map.set(instance, [])
	}
	// else instance is already waiting, this has no effect
}

Q.isReady = function (instance) {
	const ready = Q._map.get(instance)
	return ready === true
}

module.exports = Q
