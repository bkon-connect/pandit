var errors = require('./errors.js')

function Context (pandit, req, res) {
  this.pandit = pandit
  this.req = req
  this.res = res
  this._policyAuthorized = false
  this._policyScoped = false
}

Context.prototype.policyRecord = function (name, done) {
  if (name && typeof name !== 'string') return done(undefined, name)
  done(undefined, this.res.locals[name])
}

Context.prototype.policyUser = function (done) {
  done(undefined, this.req.user)
}

Context.prototype.policyBody = function (done) {
  done(undefined, this.req.body)
}

Context.prototype.policyAuthorized = function () {
  return this._policyAuthorized
}

Context.prototype.policyScoped = function () {
  return this._policyScoped
}

Context.prototype.verifyAuthorized = function (done) {
  if (this.policyAuthorized()) return done()
  done(new errors.AuthorizationNotPerformedError())
}

Context.prototype.verifyPolicyScoped = function (done) {
  if (this.policyScoped()) return done()
  done(new errors.PolicyScopingNotPerformedError())
}

Context.prototype.skipAuthorization = function () {
  this._policyAuthorized = true
}

Context.prototype.skipPolicyScope = function () {
  this._policyScoped = true
}

Context.prototype.policy = function (record, done) {
  this.policyUser(function (err, user) {
    if (err) return done(err)
    this.pandit.policy(user, record, done)
  }.bind(this))
}

Context.prototype.policyScope = function (scope, done) {
  this._policyScoped = true
  this.policyUser(function (err, user) {
    if (err) return done(err)
    this.pandit.policyScope(user, scope, done)
  }.bind(this))
}

Context.prototype.authorize = function (record, query, done) {
  this._policyAuthorized = true
  this.policy(record, function (err, policy) {
    if (err) return done(err, false)
    if (typeof policy !== 'object' || typeof policy[query] !== 'function') {
      err = new errors.NotDefinedError('Unable to find policy query')
      return done(err, false)
    }
    policy[query](function (err, allowed) {
      if (err) return done(err, false)
      if (!allowed) {
        return done(new errors.NotAuthorizedError({
          query: query,
          record: record,
          policy: policy
        }), false)
      }
      done(undefined, true)
    })
  })
}

Context.prototype.permittedAttributes = function (record, done) {
  this.policy(record, function (err, policy) {
    if (err) return done(err)
    this.policyBody(function (err, body) {
      if (err) return done(err)
      body = body || {}
      if (!policy.permittedAttributes) {
        return permittedAttributes(Object.keys(body))
      }
      policy.permittedAttributes(function (err, permitted) {
        if (err) return done(err)
        permittedAttributes(permitted)
      })
      function permittedAttributes (permitted) {
        done(undefined, permitted.filter(function (p) {
          return p in body
        }).reduce(function (p, c) {
          p[c] = body[c]
          return p
        }, {}))
      }
    })
  }.bind(this))
}

module.exports = Context
