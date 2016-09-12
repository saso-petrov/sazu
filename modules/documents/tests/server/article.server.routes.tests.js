'use strict';

var should = require('should'),
  request = require('supertest'),
  path = require('path'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Document = mongoose.model('Document'),
  express = require(path.resolve('./config/lib/express'));

/**
 * Globals
 */
var app,
  agent,
  credentials,
  user,
  document;

/**
 * Document routes tests
 */
describe('Document CRUD tests', function () {

  before(function (done) {
    // Get application
    app = express.init(mongoose);
    agent = request.agent(app);

    done();
  });

  beforeEach(function (done) {
    // Create user credentials
    credentials = {
      username: 'username',
      password: 'M3@n.jsI$Aw3$0m3'
    };

    // Create a new user
    user = new User({
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'test@test.com',
      username: credentials.username,
      password: credentials.password,
      provider: 'local'
    });

    // Save a user to the test db and create new document
    user.save(function () {
      document = {
        title: 'Document Title',
        content: 'Document Content'
      };

      done();
    });
  });

  it('should be able to save an document if logged in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new document
        agent.post('/api/documents')
          .send(document)
          .expect(200)
          .end(function (documentSaveErr, documentSaveRes) {
            // Handle document save error
            if (documentSaveErr) {
              return done(documentSaveErr);
            }

            // Get a list of documents
            agent.get('/api/documents')
              .end(function (documentsGetErr, documentsGetRes) {
                // Handle document save error
                if (documentsGetErr) {
                  return done(documentsGetErr);
                }

                // Get documents list
                var documents = documentsGetRes.body;

                // Set assertions
                (documents[0].user._id).should.equal(userId);
                (documents[0].title).should.match('Document Title');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to save an document if not logged in', function (done) {
    agent.post('/api/documents')
      .send(document)
      .expect(403)
      .end(function (documentSaveErr, documentSaveRes) {
        // Call the assertion callback
        done(documentSaveErr);
      });
  });

  it('should not be able to save an document if no title is provided', function (done) {
    // Invalidate title field
    document.title = '';

    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new document
        agent.post('/api/documents')
          .send(document)
          .expect(400)
          .end(function (documentSaveErr, documentSaveRes) {
            // Set message assertion
            (documentSaveRes.body.message).should.match('Title cannot be blank');

            // Handle document save error
            done(documentSaveErr);
          });
      });
  });

  it('should be able to update an document if signed in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new document
        agent.post('/api/documents')
          .send(document)
          .expect(200)
          .end(function (documentSaveErr, documentSaveRes) {
            // Handle document save error
            if (documentSaveErr) {
              return done(documentSaveErr);
            }

            // Update document title
            document.title = 'WHY YOU GOTTA BE SO MEAN?';

            // Update an existing document
            agent.put('/api/documents/' + documentSaveRes.body._id)
              .send(document)
              .expect(200)
              .end(function (documentUpdateErr, documentUpdateRes) {
                // Handle document update error
                if (documentUpdateErr) {
                  return done(documentUpdateErr);
                }

                // Set assertions
                (documentUpdateRes.body._id).should.equal(documentSaveRes.body._id);
                (documentUpdateRes.body.title).should.match('WHY YOU GOTTA BE SO MEAN?');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should be able to get a list of documents if not signed in', function (done) {
    // Create new document model instance
    var documentObj = new Document(document);

    // Save the document
    documentObj.save(function () {
      // Request documents
      request(app).get('/api/documents')
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Array).and.have.lengthOf(1);

          // Call the assertion callback
          done();
        });

    });
  });

  it('should be able to get a single document if not signed in', function (done) {
    // Create new document model instance
    var documentObj = new Document(document);

    // Save the document
    documentObj.save(function () {
      request(app).get('/api/documents/' + documentObj._id)
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Object).and.have.property('title', document.title);

          // Call the assertion callback
          done();
        });
    });
  });

  it('should return proper error for single document with an invalid Id, if not signed in', function (done) {
    // test is not a valid mongoose Id
    request(app).get('/api/documents/test')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'Document is invalid');

        // Call the assertion callback
        done();
      });
  });

  it('should return proper error for single document which doesnt exist, if not signed in', function (done) {
    // This is a valid mongoose Id but a non-existent document
    request(app).get('/api/documents/559e9cd815f80b4c256a8f41')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'No document with that identifier has been found');

        // Call the assertion callback
        done();
      });
  });

  it('should be able to delete an document if signed in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new document
        agent.post('/api/documents')
          .send(document)
          .expect(200)
          .end(function (documentSaveErr, documentSaveRes) {
            // Handle document save error
            if (documentSaveErr) {
              return done(documentSaveErr);
            }

            // Delete an existing document
            agent.delete('/api/documents/' + documentSaveRes.body._id)
              .send(document)
              .expect(200)
              .end(function (documentDeleteErr, documentDeleteRes) {
                // Handle document error error
                if (documentDeleteErr) {
                  return done(documentDeleteErr);
                }

                // Set assertions
                (documentDeleteRes.body._id).should.equal(documentSaveRes.body._id);

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to delete an document if not signed in', function (done) {
    // Set document user
    document.user = user;

    // Create new document model instance
    var documentObj = new Document(document);

    // Save the document
    documentObj.save(function () {
      // Try deleting document
      request(app).delete('/api/documents/' + documentObj._id)
        .expect(403)
        .end(function (documentDeleteErr, documentDeleteRes) {
          // Set message assertion
          (documentDeleteRes.body.message).should.match('User is not authorized');

          // Handle document error error
          done(documentDeleteErr);
        });

    });
  });

  it('should be able to get a single document that has an orphaned user reference', function (done) {
    // Create orphan user creds
    var _creds = {
      username: 'orphan',
      password: 'M3@n.jsI$Aw3$0m3'
    };

    // Create orphan user
    var _orphan = new User({
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'orphan@test.com',
      username: _creds.username,
      password: _creds.password,
      provider: 'local'
    });

    _orphan.save(function (err, orphan) {
      // Handle save error
      if (err) {
        return done(err);
      }

      agent.post('/api/auth/signin')
        .send(_creds)
        .expect(200)
        .end(function (signinErr, signinRes) {
          // Handle signin error
          if (signinErr) {
            return done(signinErr);
          }

          // Get the userId
          var orphanId = orphan._id;

          // Save a new document
          agent.post('/api/documents')
            .send(document)
            .expect(200)
            .end(function (documentSaveErr, documentSaveRes) {
              // Handle document save error
              if (documentSaveErr) {
                return done(documentSaveErr);
              }

              // Set assertions on new document
              (documentSaveRes.body.title).should.equal(document.title);
              should.exist(documentSaveRes.body.user);
              should.equal(documentSaveRes.body.user._id, orphanId);

              // force the document to have an orphaned user reference
              orphan.remove(function () {
                // now signin with valid user
                agent.post('/api/auth/signin')
                  .send(credentials)
                  .expect(200)
                  .end(function (err, res) {
                    // Handle signin error
                    if (err) {
                      return done(err);
                    }

                    // Get the document
                    agent.get('/api/documents/' + documentSaveRes.body._id)
                      .expect(200)
                      .end(function (documentInfoErr, documentInfoRes) {
                        // Handle document error
                        if (documentInfoErr) {
                          return done(documentInfoErr);
                        }

                        // Set assertions
                        (documentInfoRes.body._id).should.equal(documentSaveRes.body._id);
                        (documentInfoRes.body.title).should.equal(document.title);
                        should.equal(documentInfoRes.body.user, undefined);

                        // Call the assertion callback
                        done();
                      });
                  });
              });
            });
        });
    });
  });

  it('should be able to get a single document if signed in and verify the custom "isCurrentUserOwner" field is set to "true"', function (done) {
    // Create new document model instance
    document.user = user;
    var documentObj = new Document(document);

    // Save the document
    documentObj.save(function () {
      agent.post('/api/auth/signin')
        .send(credentials)
        .expect(200)
        .end(function (signinErr, signinRes) {
          // Handle signin error
          if (signinErr) {
            return done(signinErr);
          }

          // Get the userId
          var userId = user.id;

          // Save a new document
          agent.post('/api/documents')
            .send(document)
            .expect(200)
            .end(function (documentSaveErr, documentSaveRes) {
              // Handle document save error
              if (documentSaveErr) {
                return done(documentSaveErr);
              }

              // Get the document
              agent.get('/api/documents/' + documentSaveRes.body._id)
                .expect(200)
                .end(function (documentInfoErr, documentInfoRes) {
                  // Handle document error
                  if (documentInfoErr) {
                    return done(documentInfoErr);
                  }

                  // Set assertions
                  (documentInfoRes.body._id).should.equal(documentSaveRes.body._id);
                  (documentInfoRes.body.title).should.equal(document.title);

                  // Assert that the "isCurrentUserOwner" field is set to true since the current User created it
                  (documentInfoRes.body.isCurrentUserOwner).should.equal(true);

                  // Call the assertion callback
                  done();
                });
            });
        });
    });
  });

  it('should be able to get a single document if not signed in and verify the custom "isCurrentUserOwner" field is set to "false"', function (done) {
    // Create new document model instance
    var documentObj = new Document(document);

    // Save the document
    documentObj.save(function () {
      request(app).get('/api/documents/' + documentObj._id)
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Object).and.have.property('title', document.title);
          // Assert the custom field "isCurrentUserOwner" is set to false for the un-authenticated User
          res.body.should.be.instanceof(Object).and.have.property('isCurrentUserOwner', false);
          // Call the assertion callback
          done();
        });
    });
  });

  it('should be able to get single document, that a different user created, if logged in & verify the "isCurrentUserOwner" field is set to "false"', function (done) {
    // Create temporary user creds
    var _creds = {
      username: 'temp',
      password: 'M3@n.jsI$Aw3$0m3'
    };

    // Create temporary user
    var _user = new User({
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'temp@test.com',
      username: _creds.username,
      password: _creds.password,
      provider: 'local'
    });

    _user.save(function (err, _user) {
      // Handle save error
      if (err) {
        return done(err);
      }

      // Sign in with the user that will create the Document
      agent.post('/api/auth/signin')
        .send(credentials)
        .expect(200)
        .end(function (signinErr, signinRes) {
          // Handle signin error
          if (signinErr) {
            return done(signinErr);
          }

          // Get the userId
          var userId = user._id;

          // Save a new document
          agent.post('/api/documents')
            .send(document)
            .expect(200)
            .end(function (documentSaveErr, documentSaveRes) {
              // Handle document save error
              if (documentSaveErr) {
                return done(documentSaveErr);
              }

              // Set assertions on new document
              (documentSaveRes.body.title).should.equal(document.title);
              should.exist(documentSaveRes.body.user);
              should.equal(documentSaveRes.body.user._id, userId);

              // now signin with the temporary user
              agent.post('/api/auth/signin')
                .send(_creds)
                .expect(200)
                .end(function (err, res) {
                  // Handle signin error
                  if (err) {
                    return done(err);
                  }

                  // Get the document
                  agent.get('/api/documents/' + documentSaveRes.body._id)
                    .expect(200)
                    .end(function (documentInfoErr, documentInfoRes) {
                      // Handle document error
                      if (documentInfoErr) {
                        return done(documentInfoErr);
                      }

                      // Set assertions
                      (documentInfoRes.body._id).should.equal(documentSaveRes.body._id);
                      (documentInfoRes.body.title).should.equal(document.title);
                      // Assert that the custom field "isCurrentUserOwner" is set to false since the current User didn't create it
                      (documentInfoRes.body.isCurrentUserOwner).should.equal(false);

                      // Call the assertion callback
                      done();
                    });
                });
            });
        });
    });
  });

  afterEach(function (done) {
    User.remove().exec(function () {
      Document.remove().exec(done);
    });
  });
});
