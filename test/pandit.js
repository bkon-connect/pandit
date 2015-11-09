/* global describe it afterEach */
var expect = require('chai').expect
var pandit = require('../lib/index.js')
var Pandit = pandit.Pandit
var errors = pandit.errors

describe('Pandit Pandit', function () {
  describe('constructor', function () {
    it('should set a default policyDir option', function () {
      var pandit = new Pandit()
      expect(pandit.options).to.deep.equal({policyDir: './lib/policies'})
      pandit = new Pandit({})
      expect(pandit.options).to.deep.equal({policyDir: './lib/policies'})
    })

    it('should accept a default policyDir option', function () {
      var pandit = new Pandit({policyDir: 'test'})
      expect(pandit.options).to.deep.equal({policyDir: 'test'})
    })
  })

  describe('#middleware()', function () {
    it('should add a context instance the request', function (done) {
      var req = {}
      var res = {}
      var pandit = new Pandit()
      pandit.middleware(req, res, function (err) {
        expect(err).to.be.undefined
        expect(req.pandit).to.be.an.instanceof(Pandit.Context)
        expect(res).to.equal(res)
        done()
      })
    })

    it('should return `MiddlewareAlreadyUsedError` if the request already has a pandit context', function (done) {
      var req = {pandit: {}}
      var pandit = new Pandit()
      pandit.middleware(req, null, function (err) {
        expect(err).to.be.an.instanceof(errors.MiddlewareAlreadyUsedError)
        done()
      })
    })
  })

  describe('#policy()', function () {
    afterEach(function () {
      Pandit.PolicyFinder = pandit.PolicyFinder
    })

    it('should instantiate a finder and call `policy` to retrieve the policy', function (done) {
      var user = 'user'
      var record = 'record'
      var options = {}

      var policyClass = function (user_, record_) {
        this.user = user_
        this.record = record_
        expect(user_).to.equal(user)
        expect(record_).to.equal(record)
      }

      var finderClass = function (object, options_) {
        this.object = object
        this.options = options_
        expect(object).to.equal(record)
        expect(options_).to.equal(options)
      }

      finderClass.prototype.policy = function (done) {
        done(null, policyClass)
      }

      Pandit.PolicyFinder = finderClass

      var pandit = new Pandit(options)
      pandit.policy(user, record, function (err, policy) {
        expect(err).to.be.undefined
        expect(policy).to.be.an.instanceof(policyClass)
        expect(policy.user).to.equal(user)
        expect(policy.record).to.equal(record)
        done()
      })
    })

    it('should return an error if policy find fails', function (done) {
      var finderClass = function () {
      }
      finderClass.prototype.policy = function (done) {
        done('test')
      }
      Pandit.PolicyFinder = finderClass
      var pandit = new Pandit({})
      pandit.policy('user', 'record', function (err, policy) {
        expect(err).to.equal('test')
        done()
      })
    })

    it('should return an error if policy constructor throws', function (done) {
      var policyErr = new Error()
      var policyClass = function () {
        throw policyErr
      }
      var finderClass = function () {
      }
      finderClass.prototype.policy = function (done) {
        done(undefined, policyClass)
      }
      Pandit.PolicyFinder = finderClass
      var pandit = new Pandit({})
      pandit.policy('user', 'record', function (err, policy) {
        expect(err).to.equal(policyErr)
        done()
      })
    })
  })

  describe('#policyScope()', function () {
    afterEach(function () {
      Pandit.PolicyFinder = pandit.PolicyFinder
    })

    it('should instantiate a finder and call `scope` to retrieve the scope', function (done) {
      var user = 'user'
      var scope = 'scope'
      var options = {}

      var scopeClass = function (user_, scope_) {
        this.user = user_
        this.scope = scope_
        expect(user_).to.equal(user)
        expect(scope_).to.equal(scope)
      }

      scopeClass.prototype.resolve = function (done) {
        done(undefined, 'resolved')
      }

      var finderClass = function (object, options_) {
        this.object = object
        this.options = options_
        expect(object).to.equal(scope)
        expect(options_).to.equal(options)
      }

      finderClass.prototype.scope = function (done) {
        done(null, scopeClass)
      }

      Pandit.PolicyFinder = finderClass

      var pandit = new Pandit(options)
      pandit.policyScope(user, scope, function (err, resolved) {
        expect(err).to.be.undefined
        expect(resolved).to.equal('resolved')
        done()
      })
    })

    it('should return an error if scope find fails', function (done) {
      var finderClass = function () {
      }
      finderClass.prototype.scope = function (done) {
        done('test')
      }
      Pandit.PolicyFinder = finderClass
      var pandit = new Pandit({})
      pandit.policyScope('user', 'scope', function (err, resolved) {
        expect(err).to.equal('test')
        done()
      })
    })

    it('should return an error if scope constructor fails', function (done) {
      var scopeErr = new Error()
      var scopeClass = function (user_, scope_) {
        throw scopeErr
      }
      var finderClass = function () {
      }
      finderClass.prototype.scope = function (done) {
        done(undefined, scopeClass)
      }
      Pandit.PolicyFinder = finderClass
      var pandit = new Pandit({})
      pandit.policyScope('user', 'scope', function (err, resolved) {
        expect(err).to.equal(scopeErr)
        done()
      })
    })
  })
})
