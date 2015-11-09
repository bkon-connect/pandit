/* global describe it */
var expect = require('chai').expect
var pandit = require('../lib/index.js')
var Context = pandit.Context
var errors = pandit.errors

describe('Pandit Context', function () {
  describe('#policyRecord()', function () {
    it('should fetch the record from locals with the given name', function (done) {
      var ctx = new Context(null, null, {locals: {test: 'XXX'}})
      ctx.policyRecord('test', function (err, record) {
        expect(err).to.be.undefined
        expect(record).to.equal('XXX')
        done()
      })
    })

    it('should return the given name as the record if it is not a string', function (done) {
      var rec = {}
      var ctx = new Context(null, null, {locals: {}})
      ctx.policyRecord(rec, function (err, record) {
        expect(err).to.be.undefined
        expect(record).to.equal(rec)
        done()
      })
    })
  })

  describe('#policyUser()', function () {
    it('should fetch the user from `req.user`', function (done) {
      var ctx = new Context(null, {user: 'XXX'}, null)
      ctx.policyUser(function (err, user) {
        expect(err).to.be.undefined
        expect(user).to.equal('XXX')
        done()
      })
    })
  })

  describe('#policyBody()', function () {
    it('should fetch the request body', function (done) {
      var ctx = new Context(null, {body: 'XXX'})
      ctx.policyBody(function (err, body) {
        expect(err).to.be.undefined
        expect(body).to.equal('XXX')
        done()
      })
    })
  })

  describe('#policyAuthorized()', function () {
    it('should initially be false', function () {
      var ctx = new Context()
      expect(ctx.policyAuthorized()).to.be.false
    })

    it('should reflect internal `_policyAuthorized` state', function () {
      var ctx = new Context()
      ctx._policyAuthorized = true
      expect(ctx.policyAuthorized()).to.be.true
    })
  })

  describe('#policyScoped()', function () {
    it('should initially be false', function () {
      var ctx = new Context()
      expect(ctx.policyScoped()).to.be.false
    })

    it('should reflect internal `_policyScoped` state', function () {
      var ctx = new Context()
      ctx._policyScoped = true
      expect(ctx.policyScoped()).to.be.true
    })
  })

  describe('#verifyAuthorized()', function () {
    it('should return an `AuthorizationNotPerformedError` error if authorization was not performed', function (done) {
      var ctx = new Context()
      ctx.verifyAuthorized(function (err) {
        expect(err).to.be.an.instanceof(errors.AuthorizationNotPerformedError)
        done()
      })
    })

    it('should return no error if authorization was performed', function (done) {
      var ctx = new Context()
      ctx._policyAuthorized = true
      ctx.verifyAuthorized(function (err) {
        expect(err).to.be.undefined
        done()
      })
    })
  })

  describe('#verifyPolicyScoped()', function () {
    it('should return an `PolicyScopingNotPerformedError` error if scoping was not performed', function (done) {
      var ctx = new Context()
      ctx.verifyPolicyScoped(function (err) {
        expect(err).to.be.an.instanceof(errors.PolicyScopingNotPerformedError)
        done()
      })
    })

    it('should return no error if scoping was performed', function (done) {
      var ctx = new Context()
      ctx._policyScoped = true
      ctx.verifyPolicyScoped(function (err) {
        expect(err).to.be.undefined
        done()
      })
    })
  })

  describe('#skipAuthorization()', function () {
    it('should mark the context as authorized', function () {
      var ctx = new Context()
      expect(ctx.policyAuthorized()).to.be.false
      ctx.skipAuthorization()
      expect(ctx.policyAuthorized()).to.be.true
    })
  })

  describe('#skipPolicyScope()', function () {
    it('should mark the context as scoped', function () {
      var ctx = new Context()
      expect(ctx.policyScoped()).to.be.false
      ctx.skipPolicyScope()
      expect(ctx.policyScoped()).to.be.true
    })
  })

  describe('#policy()', function () {
    it('should call the `policy` method on the pandit instance with the user and record', function (done) {
      var ctx = new Context({
        policy: function (user, record, done) {
          expect(record).to.equal('record')
          expect(user).to.equal('user')
          done()
        }
      }, {user: 'user'}, null)
      ctx.policy('record', done)
    })

    it('should not mark the context as authorized', function (done) {
      var ctx = new Context({
        policy: function (user, record, done) {
          expect(ctx.policyAuthorized()).to.be.false
          done()
        }
      }, {user: 'XXX'}, null)
      expect(ctx.policyAuthorized()).to.be.false
      ctx.policy('record', done)
    })

    it('should return any error finding the user', function (done) {
      var ctx = new Context({
        policy: function (user, record, done) {
          done()
        }
      }, {user: 'XXX'}, null)
      ctx.policyUser = function (done) {
        return done('test')
      }
      ctx.policy('record', function (err) {
        expect(err).to.equal('test')
        done()
      })
    })
  })

  describe('#policyScope()', function () {
    it('should call the `policyScope` method on the pandit instance with the user and scope', function (done) {
      var ctx = new Context({
        policyScope: function (user, scope, done) {
          expect(scope).to.equal('scope')
          expect(user).to.equal('user')
          done()
        }
      }, {user: 'user'}, null)
      ctx.policyScope('scope', done)
    })

    it('should mark the context as scoped', function (done) {
      var ctx = new Context({
        policyScope: function (user, scope, done) {
          expect(ctx.policyScoped()).to.be.true
          done()
        }
      }, {user: 'user'}, null)
      expect(ctx.policyScoped()).to.be.false
      ctx.policyScope('scope', done)
    })

    it('should return any error finding the user', function (done) {
      var ctx = new Context({
        policyScope: function (user, scope, done) {
          done()
        }
      }, {user: 'XXX'}, null)
      ctx.policyUser = function (done) {
        return done('test')
      }
      ctx.policyScope('scope', function (err) {
        expect(err).to.equal('test')
        done()
      })
    })
  })

  describe('#authorize()', function () {
    it('should call the `policy` method to retrieve the policy', function (done) {
      var ctx = new Context()
      ctx.policy = function (record) {
        done()
      }
      ctx.authorize(null, 'test')
    })

    it('should mark the context as authorized', function (done) {
      var ctx = new Context()
      ctx.policy = function (record) {
        expect(ctx.policyAuthorized()).to.be.true
        done()
      }
      expect(ctx.policyAuthorized()).to.be.false
      ctx.authorize(null, 'test')
    })

    it('should return any errors passed by the `policy` method', function (done) {
      var policyErr = new Error()
      var ctx = new Context()
      ctx.policy = function (record, done) {
        done(policyErr)
      }
      ctx.authorize(null, 'test', function (err, allowed) {
        expect(err).to.equal(policyErr)
        expect(allowed).to.be.false
        done()
      })
    })

    it('should return `NotDefinedError` if the policy query cannot be found', function (done) {
      var ctx = new Context()
      ctx.policy = function (record, done) {
        done(null, {})
      }
      ctx.authorize(null, 'test', function (err, allowed) {
        expect(err).to.be.an.instanceof(errors.NotDefinedError)
        expect(allowed).to.be.false
        done()
      })
    })

    it('should call the policy query method', function (done) {
      var ctx = new Context()
      ctx.policy = function (record, done_) {
        done_(null, {
          test: function () {
            done()
          }
        })
      }
      ctx.authorize(null, 'test')
    })

    it('should return any errors passed by the query method', function (done) {
      var queryErr = new Error()
      var ctx = new Context()
      ctx.policy = function (record, done) {
        done(null, {
          test: function (done) {
            done(queryErr)
          }
        })
      }
      ctx.authorize(null, 'test', function (err, allowed) {
        expect(err).to.equal(queryErr)
        expect(allowed).to.be.false
        done()
      })
    })

    it('should return `NotAuthorizedError` if the query method returns false', function (done) {
      var policy = {
        test: function (done) {
          done(null, false)
        }
      }
      var ctx = new Context()
      ctx.policy = function (record, done) {
        done(null, policy)
      }
      ctx.authorize('record', 'test', function (err, allowed) {
        expect(err).to.be.an.instanceof(errors.NotAuthorizedError)
        expect(err.policy).to.equal(policy)
        expect(err.query).to.equal('test')
        expect(err.record).to.equal('record')
        expect(allowed).to.be.false
        done()
      })
    })

    it('should return true if the query returns true', function (done) {
      var ctx = new Context()
      ctx.policy = function (record, done) {
        done(null, {
          test: function (done) {
            done(null, true)
          }
        })
      }
      ctx.authorize(null, 'test', function (err, allowed) {
        expect(err).to.be.undefined
        expect(allowed).to.be.true
        done()
      })
    })
  })

  describe('#permittedAttributes()', function () {
    it('should call the `policy` method to retrieve the policy', function (done) {
      var ctx = new Context()
      ctx.policy = function (record) {
        expect(record).to.equal('record')
        done()
      }
      ctx.permittedAttributes('record')
    })

    it('should return any errors passed by the `policy` method', function (done) {
      var policyErr = new Error()
      var ctx = new Context()
      ctx.policy = function (record, done) {
        done(policyErr)
      }
      ctx.permittedAttributes('record', function (err) {
        expect(err).to.equal(policyErr)
        done()
      })
    })

    it('should call the `policyBody` method to retrieve the context body', function (done) {
      var ctx = new Context()
      ctx.policy = function (record, done) {
        done()
      }
      ctx.policyBody = function () {
        done()
      }
      ctx.permittedAttributes('record')
    })

    it('should return any errors passed by the `policyBody` method', function (done) {
      var bodyErr = new Error()
      var ctx = new Context()
      ctx.policy = function (record, done) {
        done()
      }
      ctx.policyBody = function (done) {
        done(bodyErr)
      }
      ctx.permittedAttributes('record', function (err) {
        expect(err).to.equal(bodyErr)
        done()
      })
    })

    it('should return an object with all properties of the body if no `permittedAttributes` exists for the policy', function (done) {
      var body = {a: 1, b: 2, c: 3}
      var ctx = new Context()
      ctx.policy = function (record, done) {
        done(null, {})
      }
      ctx.policyBody = function (done) {
        done(null, body)
      }
      ctx.permittedAttributes('record', function (err, attributes) {
        expect(err).to.be.undefined
        expect(attributes).to.deep.equal(body)
        done()
      })
    })

    it('should call the `permittedAttributes` policy method', function (done) {
      var ctx = new Context()
      ctx.policy = function (record, done_) {
        done_(null, {
          permittedAttributes: function () {
            done()
          }
        })
      }
      ctx.policyBody = function () {
        done()
      }
      ctx.permittedAttributes('record')
    })

    it('should return any errors passed by the `permittedAttributes` policy method', function (done) {
      var attrErr = new Error()
      var ctx = new Context()
      ctx.policy = function (record, done) {
        done(null, {
          permittedAttributes: function (done) {
            done(attrErr)
          }
        })
      }
      ctx.policyBody = function (done) {
        done()
      }
      ctx.permittedAttributes('record', function (err) {
        expect(err).to.equal(attrErr)
        done()
      })
    })

    it('should return an object with only properties from the body that are returned by `permittedAttributes` policy method', function (done) {
      var body = {a: 1, b: 2, c: 3}
      var ctx = new Context()
      ctx.policy = function (record, done) {
        done(null, {
          permittedAttributes: function (done) {
            done(null, ['b', 'c'])
          }
        })
      }
      ctx.policyBody = function (done) {
        done(null, body)
      }
      ctx.permittedAttributes('record', function (err, attributes) {
        expect(err).to.be.undefined
        expect(attributes).to.deep.equal({b: 2, c: 3})
        done()
      })
    })

    it('should ignore properties that are returned by `permittedAttributes` policy method but not present in the body', function (done) {
      var body = {a: 1, b: 2}
      var ctx = new Context()
      ctx.policy = function (record, done) {
        done(null, {
          permittedAttributes: function (done) {
            done(null, ['b', 'c'])
          }
        })
      }
      ctx.policyBody = function (done) {
        done(null, body)
      }
      ctx.permittedAttributes('record', function (err, attributes) {
        expect(err).to.be.undefined
        expect(attributes).to.deep.equal({b: 2})
        done()
      })
    })
  })
})
