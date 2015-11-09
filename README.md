
# pandit

[![NPM Version](https://img.shields.io/npm/v/pandit.svg)](https://www.npmjs.org/package/pandit)
[![Build Status](https://img.shields.io/travis/bkon-connect/pandit/master.svg)](https://travis-ci.org/bkon-connect/pandit)
[![Coverage Status](https://img.shields.io/coveralls/bkon-connect/pandit/master.svg)](https://coveralls.io/r/bkon-connect/pandit)

> Minimal authorization for Node.js inspired by [Pundit](https://github.com/elabs/pundit)

## Installation

```js
npm install --save pandit
```

## Policies

Pandit uses policy classes to apply authorization logic. Policy constructors receive a user and resource instance (or "record") for which authorization should be applied. Policy class methods (or "queries") define the authorization logic:

```js
module.exports = WidgetPolicy

function WidgetPolicy (user, widget) {
  this.user = user
  this.widget = widget
}

WidgetPolicy.prototype.edit = function (done) {
  if (!this.user || !this.widget) return done(undefined, false)
  if (this.user.admin) return done(undefined, true)
  done(undefined, this.user.id === this.widget.owner)
}
```

Query methods should pass `true` or `false` to the callback to indicate whether an action is authorized for the given user and record.

## Middleware

Pandit provides express/connect middleware for app integration:

```js
var pandit = require('pandit')
var express = require('express')
var app = express()

// Load the pandit middleware
app.use(pandit())
```

By default, pandit loads policies from `./lib/policies`. This may be changed by passing the `policyDir` option:

```js
app.use(pandit({policyDir: './app/policies'}))
```

## Context

The middleware adds a pandit `Context` instance at `req.pandit`. The context is responsible for loading the user and record from the request and response objects. By default, the user is loaded from `req.user` and the record is loaded from `res.locals.<name>`. The `pandit.Context` class may be [extended](#extending-the-context) to alter the default behaviour.

## Authorization

To require authorization for a particular route, use the `pandit.authorize()` helper:

```js
app.get('/widgets/:id/edit', pandit.authorize('widget', 'edit'), function (req, res) {
  res.render('widgets/edit')
})
```

In this example, the `edit` query of the `widget` policy is applied to the request. If denied, a `NotAuthorizedError` will be passed to the first [error-handling middleware](http://expressjs.com/guide/error-handling.html), which should respond appropriately:

```js
app.use(function (err, req, res, next) {
  if (!(err instanceof pandit.errors.NotAuthorizedError)) return next(err)
  res.render('errors/403')
})
```

If a particular authorization check doesn't require a record instance, or the instance is known before the route is created, the record class or record instance may be passed to `pandit.authorize()` rather than the name:

```js
var Widget = require('./models/widget.js')
app.get('/widgets/new', pandit.authorize(Widget, 'new'), function (req, res) {
  res.render('widgets/new')
})
// or
var widget = new Widget()
app.get('/widgets/global', pandit.authorize(widget, 'show'), function (req, res) {
  res.render('widgets/show', {widget: widget})
})
```

You may authorize multiple policy queries at once by passing an array to `pandit.authorize()`:

```js
app.get('/widgets/:id/toggle', pandit.authorize('widget', ['disable', 'enable']), function (req, res) {
  res.render('widgets/toggle')
})
```

## Scopes

A policy scope filters a list of records to only include those with which the user is authorized to interact. A scope is a class whose constructor receives a user and a list of records. The `resolve()` method on the scope should pass the filtered list of records to the callback. The default policy finder looks for the scope class as a `Scope` property on the policy class:

```js
function WidgetScope (user, widgets) {
  this.user = user
  this.widgets = widgets
}

WidgetScope.prototype.resolve = function (done) {
  if (!this.user) return done(undefined, [])
  done(undefined, this.widgets.filter(function (widget) {
    return this.user.id === widget.owner
  }.bind(this)))
}

WidgetPolicy.Scope = WidgetScope
```

The `pandit.scope()` helper filters the records using a given scope:

```js
app.get('/widgets', pandit.scope('widgets'), function (req, res) {
  res.render('widgets/index')
})
```

## Permitted Attributes

Policies may specify which record attributes a user is allowed to manipulate by defining a `permittedAttributes()` method, which should pass a list of authorized record attributes to the callback.

```js
WidgetPolicy.permittedAttributes = function (done) {
  if (!this.user) return done(undefined, [])
  if (this.user.admin) return done(undefined, ['name', 'gears', 'owner', 'deleted'])
  done(undefined, ['name', 'gears'])
}
```

The pandit context instance provides a `permittedAttributes()` method that filters the request body to only contain keys for which the user is authorized:

```js
app.put('/widgets/:id', function (req, res, next) {
  // Get authorized attributes from request body
  req.pandit.permittedAttributes(res.locals.widget, function (err, attrs) {
    if (err) return next(err)
    // Update the widget with the filtered attributes and save
    res.locals.widget.update(attrs, function (err) {
      if (err) return next(err)
      res.redirect('/widgets')
    })
  })
})
```

The request body is retreived from `req.body` by default, which can be altered by [extending](#extending-the-context) the pandit context.

## Requiring a User

If a policy requires a user in all cases, it's inconvenient to check for the user in each query method. Instead, a policy's constructor may throw a `pandit.errors.NotAuthorizedError` directly:

```js
function WidgetPolicy (user, widget) {
  if (!user) throw new pandit.errors.NotAuthorizedError()
  this.user = user
  this.widget = widget
}
```

## Retrieving Policies/Scopes

A policy instance may be retrieved by calling the `policy()` method on the pandit request context:

```js
app.get('/widgets/:id', function (req, res, next) {
  req.pandit.policy(Widget, function (err, policy) {
    if (err) return next(err)
    policy.edit(function (err, allowed) {
      if (err) return next(err)
      res.render('widgets/show', {canEdit: allowed})
    })
  })
})
```

A policy scope may be similarly retrieved using the `policyScope()` context method:

```js
var widgets = [new Widget(), new Widget(), new Widget()]
app.get('/widgets', function (req, res, next) {
  req.pandit.policyScope(widgets, function (err, scope) {
    if (err) return next(err)
    res.render('widgets/index', {widgets: scope})
  })
})
```

## Requiring Authorization

To ensure at least one policy has been applied to a request, the `pandit.verifyAuthorized()` helper may be used:

```js
app.get('/widgets/:id', pandit.verifyAuthorized(), function (req, res) {
  res.render('widgets/show')
})
```

If authorization has not yet been performed for a request when the `pandit.verifyAuthorized()` handler is called, a `pandit.errors.AuthorizationNotPerformedError` is passed to the error-handling middleware.

Policy scopes may be enforced with the `pandit.verifyPolicyScoped()` helper:

```js
app.get('/widgets', pandit.verifyPolicyScoped(), function (req, res) {
  res.render('widgets/index')
})
```

A `pandit.errors.PolicyScopingNotPerformedError` will be passed to the error-handling middleware if a scope has not yet been applied for a request.

The verification methods are also available on the request context:

```js
app.get('/widgets/:id', function (req, res, next) {
  req.pandit.verifyAuthorized(function (err) {
    if (err) return next(err)
    res.render('widgets/show')
  })
})
// and
app.get('/widgets', function (req, res, next) {
  req.pandit.verifyPolicyScoped(function (err) {
    if (err) return next(err)
    res.render('widgets/index')
  })
})
```

Both verification methods may be skipped for a particular request, allowing global authorization requirements that should be bypassed in certain cases:

```js
app.get('/widgets/:id', function (req, res, next) {
  if (process.env.NODE_ENV === 'test') req.pandit.skipAuthorization()
  next()
}, pandit.verifyAuthorized(), function (req, res) {
  res.render('widgets/show')
})
// and
app.get('/widgets', function (req, res, next) {
  if (process.env.NODE_ENV === 'test') req.pandit.skipPolicyScope()
  next()
}, pandit.verifyPolicyScoped(), function (req, res)
  res.render('widgets/index')
})
```

## Extending the Context

Pandit context methods may be overridden to customize behaviour. To globally override the context, add a custom context class to the `pandit.Pandit` class:

```js
var util = require('util')
var User = require('./models/user.js')
var Context = pandit.Context

function CustomContext () {
  Context.apply(this, arguments)
}

util.inherits(CustomContext, Context)

CustomContext.prototype.policyUser = function (done) {
  // Find the user from a session rather than `req.user`
  User.findById(req.session.userId, done)
}

CustomContext.prototype.policyRecord = function (name, done) {
  // Allow passing a record or record class directly rather than a name
  if (typeof name !== 'string') return done(undefined, name)
  // Load the record from `req.models` rather than `res.locals`
  done(undefined, this.req.models[name])
}

CustomContext.prototype.policyBody = function (done) {
  // Load the request body from `req.query` rather than `req.body`
  done(undefined, this.req.query)
}

// Set the global pandit context class
pandit.Pandit.Context = CustomContext

// Add middleware *after* setting the context class
app.use(pandit())
```

The context class may be overridden per-request by using a custom middleware:

```js
app.use(function (req, res, next) {
  if (req.pandit) return next(new pandit.errors.MiddlewareAlreadyUsedError())
  req.pandit = new CustomContext(new pandit.Pandit(), req, res)
  next()
})
```

## Policy Finder

To determine the appropriate policy for a record, record class or scope, the default policy finder attempts to find the name of the record type by looking in a few predefined places:

* `object.policyClass` - Explicitly set policy for a record class
* `object.constructor.policyClass` - Explicitly set policy for a record instance
* `object.modelName` - For [Mongoose](http://mongoosejs.com) models
* `object.model.modelName` - For [Mongoose](http://mongoosejs.com) queries
* `object.constructor.modelName` - For [Mongoose](http://mongoosejs.com) document instances

If the object is a list of records, the first object in the list is used for name lookup. If the name is found and it is not a string, the name itself is assumed to be the policy class. If the name is a string, the policy finder converts it from camel/Pascal case into a lowercase hyphenated filename, ie `WidgetCategory` becomes `widget-category.js`. The file is then loaded from the policy dir.

The policy finder logic may altered by using a custom policy finder class:

```js
var util = require('util')
var PolicyFinder = pandit.PolicyFinder

function CustomPolicyFinder () {
  PolicyFinder.apply(this, arguments)
}

util.inherits(CustomPolicyFinder, PolicyFinder)

CustomPolicyFinder.prototype.find = function () {
  // Find the policy via `_pandit` property on the record
  return this.object._pandit
}

CustomPolicyFinder.prototype.loadPolicy = function (name, done) {
  // Load policy from custom location
  try {
    var policy = require('./policies/' + name + '/policy.js')
  } catch (err) {
    if (err && err.code === 'MODULE_NOT_FOUND') {
      return done(new pandit.errors.NotDefinedError('Unable to find policy'))
    }
    return done(err)
  }
  done(undefined, policy)
}

// Set the global pandit policy finder class
pandit.Pandit.PolicyFinder = CustomPolicyFinder

// Add middleware *after* setting the policy finder class
app.use(pandit())
```

---

[![BKON Powered](http://bkon.com/wp-content/uploads/2015/11/BKONSmallBlue.png)](https://bkon.com)

> Developed at [BKON](https://bkon.com)
