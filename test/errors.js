/* global describe it beforeEach afterEach */
var expect = require('chai').expect
var errors = require('../lib/index.js').errors

describe('Pandit Errors', function () {
  describe('PanditError', function () {
    it('should be an instance of Error', function () {
      var err = new errors.Error()
      expect(err).to.be.an.instanceof(Error)
    })
  })

  describe('MiddlewareAlreadyUsedError', function () {
    it('should be an instance of PanditError', function () {
      var err = new errors.MiddlewareAlreadyUsedError()
      expect(err).to.be.an.instanceof(errors.Error)
    })
  })

  describe('MiddlewareNotUsedError', function () {
    it('should be an instance of PanditError', function () {
      var err = new errors.MiddlewareNotUsedError()
      expect(err).to.be.an.instanceof(errors.Error)
    })
  })

  describe('NotAuthorizedError', function () {
    it('should be an instance of PanditError', function () {
      var err = new errors.NotAuthorizedError()
      expect(err).to.be.an.instanceof(errors.Error)
    })

    it('should set the message from a string argument', function () {
      var err = new errors.NotAuthorizedError('test')
      expect(err.message).to.equal('test')
    })

    it('should set the message from an options argument', function () {
      var err = new errors.NotAuthorizedError({message: 'test'})
      expect(err.message).to.equal('test')
    })
  })

  describe('AuthorizationNotPerformedError', function () {
    it('should be an instance of PanditError', function () {
      var err = new errors.AuthorizationNotPerformedError()
      expect(err).to.be.an.instanceof(errors.Error)
    })
  })

  describe('PolicyScopingNotPerformedError', function () {
    it('should be an instance of PolicyScopingNotPerformedError', function () {
      var err = new errors.PolicyScopingNotPerformedError()
      expect(err).to.be.an.instanceof(errors.AuthorizationNotPerformedError)
    })
  })

  describe('NotDefinedError', function () {
    it('should be an instance of PanditError', function () {
      var err = new errors.NotDefinedError()
      expect(err).to.be.an.instanceof(errors.Error)
    })
  })

  describe('#captureStackTrace()', function () {
    var captureStackTrace

    beforeEach(function () {
      captureStackTrace = Error.captureStackTrace
    })

    afterEach(function () {
      Error.captureStackTrace = captureStackTrace
    })

    it('should use `Error.captureStackTrace()` if supported', function (done) {
      Error.captureStackTrace = function (err, constructor) {
        expect(err).to.equal('err')
        expect(constructor).to.equal('constructor')
        done()
      }
      errors.captureStackTrace('err', 'constructor')
    })

    it('should use an existing stack if `Error.captureStackTrace()` is not supported', function () {
      Error.captureStackTrace = undefined
      var err = {stack: 'test'}
      errors.captureStackTrace(err)
      expect(err.stack).to.equal('test')
    })

    it('should fall back to the constructor name for the stack if constructor is given', function () {
      Error.captureStackTrace = undefined
      var err = {}
      var constructor = {name: 'const'}
      errors.captureStackTrace(err, constructor)
      expect(err.stack).to.equal('const')
    })

    it('should fall back to the error name for the stack if constructor is not given', function () {
      Error.captureStackTrace = undefined
      var err = {name: 'TestError'}
      errors.captureStackTrace(err)
      expect(err.stack).to.equal('TestError')
    })

    it('should fall back to `Error` if the error has no name', function () {
      Error.captureStackTrace = undefined
      var err = {}
      errors.captureStackTrace(err)
      expect(err.stack).to.equal('Error')
    })
  })
})
