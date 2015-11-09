var errors = require('./errors.js')
var Pandit = require('./pandit.js')

function pandit (options) {
  var pandit = new Pandit(options)
  return pandit.middleware.bind(pandit)
}

pandit.authorize = function (name, query) {
  return function (req, res, next) {
    if (!req.pandit) return next(new errors.MiddlewareNotUsedError())
    req.pandit.policyRecord(name, function (err, record) {
      if (err) return next(err)
      var queries = [].concat(query)
      nextQuery()
      function nextQuery (err) {
        if (err || !queries.length) return next(err)
        query = queries.shift()
        req.pandit.authorize(record, query, nextQuery)
      }
    })
  }
}

pandit.scope = function (name) {
  return function (req, res, next) {
    if (!req.pandit) return next(new errors.MiddlewareNotUsedError())
    req.pandit.policyRecord(name, function (err, scope) {
      if (err) return next(err)
      req.pandit.policyScope(scope, next)
    })
  }
}

pandit.verifyAuthorized = function () {
  return function (req, res, next) {
    if (!req.pandit) return next(new errors.MiddlewareNotUsedError())
    req.pandit.verifyAuthorized(next)
  }
}

pandit.verifyPolicyScoped = function () {
  return function (req, res, next) {
    if (!req.pandit) return next(new errors.MiddlewareNotUsedError())
    req.pandit.verifyPolicyScoped(next)
  }
}

pandit.Pandit = Pandit
pandit.Context = Pandit.Context
pandit.PolicyFinder = Pandit.PolicyFinder
pandit.errors = errors

module.exports = pandit
