/* global describe it */
var expect = require('chai').expect
var pandit = require('../lib/index.js')
var errors = pandit.errors

describe('Pandit', function () {
  describe('module', function () {
    it('should export a function', function () {
      expect(pandit).to.be.a.function
    })

    it('should return a middleware function', function () {
      var fn = pandit()
      expect(fn).to.be.a.function
      expect(fn.length).to.equal(3)
    })
  })

  describe('#authorize()', function () {
    it('should return a `MiddlewareNotUsedError` if the pandit middleware is not installed', function (done) {
      pandit.authorize('test', 'xxx')({}, {}, function (err) {
        expect(err).to.be.an.instanceof(errors.MiddlewareNotUsedError)
        done()
      })
    })

    it('should call the `policyRecord` method on the context to retrieve the record', function (done) {
      var req = {
        pandit: {
          policyRecord: function (name) {
            expect(name).to.equal('test')
            done()
          }
        }
      }
      pandit.authorize('test', 'xxx')(req, {})
    })

    it('should return any errors from the `policyRecord` context method', function (done) {
      var policyRecordErr = new Error()
      var req = {
        pandit: {
          policyRecord: function (name, done) {
            done(policyRecordErr)
          }
        }
      }
      pandit.authorize('test', 'xxx')(req, {}, function (err) {
        expect(err).to.equal(policyRecordErr)
        done()
      })
    })

    it('should call the `authorize` method on the context with the record and query', function (done) {
      var req = {
        pandit: {
          policyRecord: function (name, done) {
            done(null, name)
          },
          authorize: function (record, query, done) {
            expect(record).to.equal('test')
            expect(query).to.equal('xxx')
            done()
          }
        }
      }
      pandit.authorize('test', 'xxx')(req, {}, done)
    })

    it('should call the `authorize` method on the context with the record and each query if multiple queries given', function (done) {
      var queries = []
      var req = {
        pandit: {
          policyRecord: function (name, done) {
            done(null, name)
          },
          authorize: function (record, query, done) {
            expect(record).to.equal('test')
            queries.push(query)
            done()
          }
        }
      }
      pandit.authorize('test', ['xxx', 'yyy', 'zzz'])(req, {}, function (err) {
        expect(err).to.be.undefined
        expect(queries.length).to.equal(3)
        expect(queries[0]).to.equal('xxx')
        expect(queries[1]).to.equal('yyy')
        expect(queries[2]).to.equal('zzz')
        done()
      })
    })

    it('should return the first `authorize` error if multiple queries given', function (done) {
      var queries = []
      var req = {
        pandit: {
          policyRecord: function (name, done) {
            done(null, name)
          },
          authorize: function (record, query, done) {
            expect(record).to.equal('test')
            queries.push(query)
            if (query === 'yyy') return done('test')
            done()
          }
        }
      }
      pandit.authorize('test', ['xxx', 'yyy', 'zzz'])(req, {}, function (err) {
        expect(err).to.equal('test')
        expect(queries.length).to.equal(2)
        expect(queries[0]).to.equal('xxx')
        expect(queries[1]).to.equal('yyy')
        done()
      })
    })
  })

  describe('#scope()', function () {
    it('should return a `MiddlewareNotUsedError` if the pandit middleware is not installed', function (done) {
      pandit.scope('test')({}, {}, function (err) {
        expect(err).to.be.an.instanceof(errors.MiddlewareNotUsedError)
        done()
      })
    })

    it('should call the `policyRecord` method on the context to retrieve the record', function (done) {
      var req = {
        pandit: {
          policyRecord: function (name) {
            expect(name).to.equal('test')
            done()
          }
        }
      }
      pandit.scope('test')(req, {})
    })

    it('should return any errors from the `policyRecord` context method', function (done) {
      var policyRecordErr = new Error()
      var req = {
        pandit: {
          policyRecord: function (name, done) {
            done(policyRecordErr)
          }
        }
      }
      pandit.scope('test')(req, {}, function (err) {
        expect(err).to.equal(policyRecordErr)
        done()
      })
    })

    it('should call the `policyScope` method on the context with the scope and query', function (done) {
      var req = {
        pandit: {
          policyRecord: function (name, done) {
            done(null, name)
          },
          policyScope: function (scope) {
            expect(scope).to.equal('test')
            done()
          }
        }
      }
      pandit.scope('test')(req, {})
    })
  })

  describe('#verifyAuthorized()', function () {
    it('should return a `MiddlewareNotUsedError` if the pandit middleware is not installed', function (done) {
      pandit.verifyAuthorized()({}, {}, function (err) {
        expect(err).to.be.an.instanceof(errors.MiddlewareNotUsedError)
        done()
      })
    })

    it('should call the `verifyAuthorized` method on the context to verify', function (done) {
      var req = {
        pandit: {
          verifyAuthorized: function () {
            done()
          }
        }
      }
      pandit.verifyAuthorized()(req, {})
    })
  })

  describe('#verifyPolicyScoped()', function () {
    it('should return a `MiddlewareNotUsedError` if the pandit middleware is not installed', function (done) {
      pandit.verifyPolicyScoped()({}, {}, function (err) {
        expect(err).to.be.an.instanceof(errors.MiddlewareNotUsedError)
        done()
      })
    })

    it('should call the `verifyPolicyScoped` method on the context to verify', function (done) {
      var req = {
        pandit: {
          verifyPolicyScoped: function () {
            done()
          }
        }
      }
      pandit.verifyPolicyScoped()(req, {})
    })
  })
})
