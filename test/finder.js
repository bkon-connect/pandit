/* global describe it */
var path = require('path')
var expect = require('chai').expect
var pandit = require('../lib/index.js')
var PolicyFinder = pandit.PolicyFinder
var errors = pandit.errors

describe('Pandit PolicyFinder', function () {
  describe('#policy()', function () {
    it('should return `NotDefinedError` if no object is given', function (done) {
      var finder = new PolicyFinder()
      finder.policy(function (err) {
        expect(err).to.be.an.instanceof(errors.NotDefinedError)
        done()
      })
    })

    it('should call `find` method to retrieve the policy', function (done) {
      var found = {}
      var finder = new PolicyFinder()
      finder.find = function () {
        return found
      }
      finder.policy(function (err, policy) {
        expect(err).to.be.undefined
        expect(policy).to.be.equal(found)
        done()
      })
    })

    it('should call `loadPolicy` method to retrieve the policy if `find` returns a string', function (done) {
      var found = {}
      var finder = new PolicyFinder()
      finder.find = function () {
        return 'found'
      }
      finder.loadPolicy = function (name, done) {
        done(undefined, found)
      }
      finder.policy(function (err, policy) {
        expect(err).to.be.undefined
        expect(policy).to.be.equal(found)
        done()
      })
    })
  })

  describe('#scope()', function () {
    it('should return `NotDefinedError` if no object is given', function (done) {
      var finder = new PolicyFinder()
      finder.scope(function (err) {
        expect(err).to.be.an.instanceof(errors.NotDefinedError)
        done()
      })
    })

    it('should call `policy` method to retrieve the policy', function (done) {
      var finder = new PolicyFinder()
      finder.policy = function () {
        done()
      }
      finder.scope()
    })

    it('should return `NotDefinedError` if no scope exists on the policy', function (done) {
      var finder = new PolicyFinder()
      finder.policy = function (done) {
        done(null, {})
      }
      finder.scope(function (err) {
        expect(err).to.be.an.instanceof(errors.NotDefinedError)
        done()
      })
    })

    it('should return the scope from the policy', function (done) {
      var found = {}
      var finder = new PolicyFinder()
      finder.policy = function (done) {
        done(null, {Scope: found})
      }
      finder.scope(function (err, scope) {
        expect(err).to.be.undefined
        expect(scope).to.equal(found)
        done()
      })
    })
  })

  describe('#find()', function () {
    it('should return undefined if no object is given', function () {
      var finder = new PolicyFinder()
      expect(finder.find()).to.be.undefined
    })

    it('should return the `policyClass` property of the object if present', function () {
      var finder = new PolicyFinder({policyClass: 'found'})
      expect(finder.find()).to.equal('found')
    })

    it('should return the `policyClass` property of the model if present', function () {
      var finder = new PolicyFinder({model: {policyClass: 'found'}})
      expect(finder.find()).to.equal('found')
    })

    it('should return the `policyClass` property of the object\'s constructor if present', function () {
      var finder = new PolicyFinder({constructor: {policyClass: 'found'}})
      expect(finder.find()).to.equal('found')
    })

    it('should return the `modelName` property of the object if present', function () {
      var finder = new PolicyFinder({modelName: 'found'})
      expect(finder.find()).to.equal('found')
    })

    it('should return the `modelName` property of the object\'s `model` property if present', function () {
      var finder = new PolicyFinder({model: {modelName: 'found'}})
      expect(finder.find()).to.equal('found')
    })

    it('should return the `modelName` property of the object\'s constructor if present', function () {
      var finder = new PolicyFinder({constructor: {modelName: 'found'}})
      expect(finder.find()).to.equal('found')
    })

    it('should return undefined if `modelName` property of the object\'s constructor is not present', function () {
      var finder = new PolicyFinder({constructor: {}})
      expect(finder.find()).to.be.undefined
    })

    it('should find the policy for the first item if the object is an array', function () {
      var finder = new PolicyFinder([{policyClass: 'found'}])
      expect(finder.find()).to.equal('found')
    })
  })

  describe('#loadPolicy()', function () {
    it('should return `NotDefinedError` when no policy file exists', function (done) {
      var finder = new PolicyFinder(null, {
        policyDir: path.resolve(__dirname, './fixtures')
      })
      finder.loadPolicy('missing', function (err) {
        expect(err).to.be.an.instanceof(errors.NotDefinedError)
        done()
      })
    })

    it('should return any errors encountered while loading the policy file', function (done) {
      var finder = new PolicyFinder(null, {
        policyDir: path.resolve(__dirname, './fixtures')
      })
      finder.loadPolicy('error', function (err) {
        expect(err).to.be.an.instanceof(Error)
        expect(err.message).to.equal('test')
        done()
      })
    })

    it('should return the policy loaded from the file', function (done) {
      var finder = new PolicyFinder(null, {
        policyDir: path.resolve(__dirname, './fixtures')
      })
      finder.loadPolicy('test', function (err, policy) {
        expect(err).to.be.undefined
        expect(policy).to.equal('test')
        done()
      })
    })

    it('should convert camel case policy names to hyphens for the policy filename', function (done) {
      var finder = new PolicyFinder(null, {
        policyDir: path.resolve(__dirname, './fixtures')
      })
      finder.loadPolicy('camelTest', function (err, policy) {
        expect(err).to.be.undefined
        expect(policy).to.equal('camel-test')
        done()
      })
    })
  })
})
