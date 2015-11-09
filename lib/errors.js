var util = require('util')

function PanditError (message) {
  Error.call(this)
  captureStackTrace(this, PanditError)
  this.message = message
}
util.inherits(PanditError, Error)

function MiddlewareAlreadyUsedError (message) {
  message = message || 'Pandit middleware already used'
  PanditError.call(this, message)
  captureStackTrace(this, MiddlewareAlreadyUsedError)
}
util.inherits(MiddlewareAlreadyUsedError, PanditError)

function MiddlewareNotUsedError (message) {
  message = message || 'Pandit middleware not used'
  PanditError.call(this, message)
  captureStackTrace(this, MiddlewareNotUsedError)
}
util.inherits(MiddlewareNotUsedError, PanditError)

function NotAuthorizedError (options) {
  var message
  options = options || {}
  if (typeof options === 'string') {
    message = options
  } else {
    this.query = options.query
    this.record = options.record
    this.policy = options.policy
    message = options.message || 'Not allowed to ' + this.query + ' this ' + this.record
  }

  PanditError.call(this, message)
  captureStackTrace(this, NotAuthorizedError)
}
util.inherits(NotAuthorizedError, PanditError)

function AuthorizationNotPerformedError (message) {
  PanditError.call(this, message)
  captureStackTrace(this, AuthorizationNotPerformedError)
}
util.inherits(AuthorizationNotPerformedError, PanditError)

function PolicyScopingNotPerformedError (message) {
  AuthorizationNotPerformedError.call(this, message)
  captureStackTrace(this, PolicyScopingNotPerformedError)
}
util.inherits(PolicyScopingNotPerformedError, AuthorizationNotPerformedError)

function NotDefinedError (message) {
  PanditError.call(this, message)
  captureStackTrace(this, NotDefinedError)
}
util.inherits(NotDefinedError, PanditError)

function captureStackTrace (err, constructor) {
  if (Error.captureStackTrace) return Error.captureStackTrace(err, constructor)
  err.stack = err.stack || (constructor && constructor.name) || err.name || 'Error'
}

module.exports = {
  Error: PanditError,
  MiddlewareAlreadyUsedError: MiddlewareAlreadyUsedError,
  MiddlewareNotUsedError: MiddlewareNotUsedError,
  NotAuthorizedError: NotAuthorizedError,
  AuthorizationNotPerformedError: AuthorizationNotPerformedError,
  PolicyScopingNotPerformedError: PolicyScopingNotPerformedError,
  NotDefinedError: NotDefinedError,
  captureStackTrace: captureStackTrace
}
