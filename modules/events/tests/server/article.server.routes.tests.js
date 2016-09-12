'use strict';

var should = require('should'),
  request = require('supertest'),
  path = require('path'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Event = mongoose.model('Event'),
  express = require(path.resolve('./config/lib/express'));

/**
 * Globals
 */
var app,
  agent,
  credentials,
  user,
  event;

/**
 * Event routes tests
 */
describe('Event CRUD tests', function () {

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

    // Save a user to the test db and create new event
    user.save(function () {
      event = {
        title: 'Event Title',
        content: 'Event Content'
      };

      done();
    });
  });

  it('should be able to save an event if logged in', function (done) {
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

        // Save a new event
        agent.post('/api/events')
          .send(event)
          .expect(200)
          .end(function (eventSaveErr, eventSaveRes) {
            // Handle event save error
            if (eventSaveErr) {
              return done(eventSaveErr);
            }

            // Get a list of events
            agent.get('/api/events')
              .end(function (eventsGetErr, eventsGetRes) {
                // Handle event save error
                if (eventsGetErr) {
                  return done(eventsGetErr);
                }

                // Get events list
                var events = eventsGetRes.body;

                // Set assertions
                (events[0].user._id).should.equal(userId);
                (events[0].title).should.match('Event Title');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to save an event if not logged in', function (done) {
    agent.post('/api/events')
      .send(event)
      .expect(403)
      .end(function (eventSaveErr, eventSaveRes) {
        // Call the assertion callback
        done(eventSaveErr);
      });
  });

  it('should not be able to save an event if no title is provided', function (done) {
    // Invalidate title field
    event.title = '';

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

        // Save a new event
        agent.post('/api/events')
          .send(event)
          .expect(400)
          .end(function (eventSaveErr, eventSaveRes) {
            // Set message assertion
            (eventSaveRes.body.message).should.match('Title cannot be blank');

            // Handle event save error
            done(eventSaveErr);
          });
      });
  });

  it('should be able to update an event if signed in', function (done) {
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

        // Save a new event
        agent.post('/api/events')
          .send(event)
          .expect(200)
          .end(function (eventSaveErr, eventSaveRes) {
            // Handle event save error
            if (eventSaveErr) {
              return done(eventSaveErr);
            }

            // Update event title
            event.title = 'WHY YOU GOTTA BE SO MEAN?';

            // Update an existing event
            agent.put('/api/events/' + eventSaveRes.body._id)
              .send(event)
              .expect(200)
              .end(function (eventUpdateErr, eventUpdateRes) {
                // Handle event update error
                if (eventUpdateErr) {
                  return done(eventUpdateErr);
                }

                // Set assertions
                (eventUpdateRes.body._id).should.equal(eventSaveRes.body._id);
                (eventUpdateRes.body.title).should.match('WHY YOU GOTTA BE SO MEAN?');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should be able to get a list of events if not signed in', function (done) {
    // Create new event model instance
    var eventObj = new Event(event);

    // Save the event
    eventObj.save(function () {
      // Request events
      request(app).get('/api/events')
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Array).and.have.lengthOf(1);

          // Call the assertion callback
          done();
        });

    });
  });

  it('should be able to get a single event if not signed in', function (done) {
    // Create new event model instance
    var eventObj = new Event(event);

    // Save the event
    eventObj.save(function () {
      request(app).get('/api/events/' + eventObj._id)
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Object).and.have.property('title', event.title);

          // Call the assertion callback
          done();
        });
    });
  });

  it('should return proper error for single event with an invalid Id, if not signed in', function (done) {
    // test is not a valid mongoose Id
    request(app).get('/api/events/test')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'Event is invalid');

        // Call the assertion callback
        done();
      });
  });

  it('should return proper error for single event which doesnt exist, if not signed in', function (done) {
    // This is a valid mongoose Id but a non-existent event
    request(app).get('/api/events/559e9cd815f80b4c256a8f41')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'No event with that identifier has been found');

        // Call the assertion callback
        done();
      });
  });

  it('should be able to delete an event if signed in', function (done) {
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

        // Save a new event
        agent.post('/api/events')
          .send(event)
          .expect(200)
          .end(function (eventSaveErr, eventSaveRes) {
            // Handle event save error
            if (eventSaveErr) {
              return done(eventSaveErr);
            }

            // Delete an existing event
            agent.delete('/api/events/' + eventSaveRes.body._id)
              .send(event)
              .expect(200)
              .end(function (eventDeleteErr, eventDeleteRes) {
                // Handle event error error
                if (eventDeleteErr) {
                  return done(eventDeleteErr);
                }

                // Set assertions
                (eventDeleteRes.body._id).should.equal(eventSaveRes.body._id);

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to delete an event if not signed in', function (done) {
    // Set event user
    event.user = user;

    // Create new event model instance
    var eventObj = new Event(event);

    // Save the event
    eventObj.save(function () {
      // Try deleting event
      request(app).delete('/api/events/' + eventObj._id)
        .expect(403)
        .end(function (eventDeleteErr, eventDeleteRes) {
          // Set message assertion
          (eventDeleteRes.body.message).should.match('User is not authorized');

          // Handle event error error
          done(eventDeleteErr);
        });

    });
  });

  it('should be able to get a single event that has an orphaned user reference', function (done) {
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

          // Save a new event
          agent.post('/api/events')
            .send(event)
            .expect(200)
            .end(function (eventSaveErr, eventSaveRes) {
              // Handle event save error
              if (eventSaveErr) {
                return done(eventSaveErr);
              }

              // Set assertions on new event
              (eventSaveRes.body.title).should.equal(event.title);
              should.exist(eventSaveRes.body.user);
              should.equal(eventSaveRes.body.user._id, orphanId);

              // force the event to have an orphaned user reference
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

                    // Get the event
                    agent.get('/api/events/' + eventSaveRes.body._id)
                      .expect(200)
                      .end(function (eventInfoErr, eventInfoRes) {
                        // Handle event error
                        if (eventInfoErr) {
                          return done(eventInfoErr);
                        }

                        // Set assertions
                        (eventInfoRes.body._id).should.equal(eventSaveRes.body._id);
                        (eventInfoRes.body.title).should.equal(event.title);
                        should.equal(eventInfoRes.body.user, undefined);

                        // Call the assertion callback
                        done();
                      });
                  });
              });
            });
        });
    });
  });

  it('should be able to get a single event if signed in and verify the custom "isCurrentUserOwner" field is set to "true"', function (done) {
    // Create new event model instance
    event.user = user;
    var eventObj = new Event(event);

    // Save the event
    eventObj.save(function () {
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

          // Save a new event
          agent.post('/api/events')
            .send(event)
            .expect(200)
            .end(function (eventSaveErr, eventSaveRes) {
              // Handle event save error
              if (eventSaveErr) {
                return done(eventSaveErr);
              }

              // Get the event
              agent.get('/api/events/' + eventSaveRes.body._id)
                .expect(200)
                .end(function (eventInfoErr, eventInfoRes) {
                  // Handle event error
                  if (eventInfoErr) {
                    return done(eventInfoErr);
                  }

                  // Set assertions
                  (eventInfoRes.body._id).should.equal(eventSaveRes.body._id);
                  (eventInfoRes.body.title).should.equal(event.title);

                  // Assert that the "isCurrentUserOwner" field is set to true since the current User created it
                  (eventInfoRes.body.isCurrentUserOwner).should.equal(true);

                  // Call the assertion callback
                  done();
                });
            });
        });
    });
  });

  it('should be able to get a single event if not signed in and verify the custom "isCurrentUserOwner" field is set to "false"', function (done) {
    // Create new event model instance
    var eventObj = new Event(event);

    // Save the event
    eventObj.save(function () {
      request(app).get('/api/events/' + eventObj._id)
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Object).and.have.property('title', event.title);
          // Assert the custom field "isCurrentUserOwner" is set to false for the un-authenticated User
          res.body.should.be.instanceof(Object).and.have.property('isCurrentUserOwner', false);
          // Call the assertion callback
          done();
        });
    });
  });

  it('should be able to get single event, that a different user created, if logged in & verify the "isCurrentUserOwner" field is set to "false"', function (done) {
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

      // Sign in with the user that will create the Event
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

          // Save a new event
          agent.post('/api/events')
            .send(event)
            .expect(200)
            .end(function (eventSaveErr, eventSaveRes) {
              // Handle event save error
              if (eventSaveErr) {
                return done(eventSaveErr);
              }

              // Set assertions on new event
              (eventSaveRes.body.title).should.equal(event.title);
              should.exist(eventSaveRes.body.user);
              should.equal(eventSaveRes.body.user._id, userId);

              // now signin with the temporary user
              agent.post('/api/auth/signin')
                .send(_creds)
                .expect(200)
                .end(function (err, res) {
                  // Handle signin error
                  if (err) {
                    return done(err);
                  }

                  // Get the event
                  agent.get('/api/events/' + eventSaveRes.body._id)
                    .expect(200)
                    .end(function (eventInfoErr, eventInfoRes) {
                      // Handle event error
                      if (eventInfoErr) {
                        return done(eventInfoErr);
                      }

                      // Set assertions
                      (eventInfoRes.body._id).should.equal(eventSaveRes.body._id);
                      (eventInfoRes.body.title).should.equal(event.title);
                      // Assert that the custom field "isCurrentUserOwner" is set to false since the current User didn't create it
                      (eventInfoRes.body.isCurrentUserOwner).should.equal(false);

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
      Event.remove().exec(done);
    });
  });
});
