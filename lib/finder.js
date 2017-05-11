var errors = require('./errors.js')
var path = require('path')

function PolicyFinder (object, options) {
  this.object = object
  this.options = options || {}
}

PolicyFinder.prototype.policy = function (done) {
  var policy = this.find()
  if (!policy) return done(new errors.NotDefinedError('Unable to find policy'))
  if (typeof policy === 'string') return this.loadPolicy(policy, done)
  done(undefined, policy)
}

PolicyFinder.prototype.scope = function (done) {
  this.policy(function (err, policy) {
    if (err) return done(err)
    if (!policy || !policy.Scope) {
      return done(new errors.NotDefinedError('Unable to find scope'))
    }
    done(undefined, policy.Scope)
  })
}

PolicyFinder.prototype.find = function () {
  var obj = this.object
  if (Array.isArray(obj)) return new PolicyFinder(obj[0], this.options).find()
  if (!obj) return undefined
  if (obj.policyClass) return obj.policyClass
  if (obj.model && obj.model.policyClass) return obj.model.policyClass
  if (obj.constructor && obj.constructor.policyClass) {
    return obj.constructor.policyClass
  }
  if (obj.modelName) return obj.modelName
  if (obj.model && obj.model.modelName) return obj.model.modelName
  if (obj.constructor && obj.constructor.modelName) {
    return obj.constructor.modelName
  }
}

PolicyFinder.prototype.loadPolicy = function (name, done) {
  name = name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
  var policyFile = path.resolve(this.options.policyDir, name + '.js')
  try {
    var policy = require(policyFile)
  } catch (err) {
    if (err && err.code === 'MODULE_NOT_FOUND') {
      return done(new errors.NotDefinedError('Unable to find policy'))
    }
    return done(err)
  }
  done(undefined, policy)
}

module.exports = PolicyFinder
