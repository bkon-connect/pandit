var errors = require('./errors.js')
var Context = require('./context.js')
var PolicyFinder = require('./finder.js')

function Pandit (options) {
  this.options = options || {}
  this.options.policyDir = this.options.policyDir || './lib/policies'
}

Pandit.prototype.middleware = function (req, res, next) {
  if (req.pandit) return next(new errors.MiddlewareAlreadyUsedError())
  req.pandit = new this.constructor.Context(this, req, res)
  next()
}

Pandit.prototype.policy = function (user, record, done) {
  var finder = new this.constructor.PolicyFinder(record, this.options)
  finder.policy(function (err, Policy) {
    if (err) return done(err)
    try {
      var policy = new Policy(user, record)
    } catch (err) {
      return done(err)
    }
    done(undefined, policy)
  })
}

Pandit.prototype.policyScope = function (user, scope, done) {
  var finder = new this.constructor.PolicyFinder(scope, this.options)
  finder.scope(function (err, PolicyScope) {
    if (err) return done(err)
    try {
      var policyScope = new PolicyScope(user, scope)
    } catch (err) {
      return done(err)
    }
    policyScope.resolve(done)
  })
}

Pandit.Context = Context
Pandit.PolicyFinder = PolicyFinder
Pandit.errors = errors

module.exports = Pandit
