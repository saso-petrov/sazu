'use strict';

/**
 * Module dependencies
 */
var eventsPolicy = require('../policies/events.server.policy'),
    events = require('../controllers/events.server.controller');

var fs = require('fs'),
    gm = require('gm'),
path = require('path');


module.exports = function (app) {
    // Events collection routes
    app.route('/api/events').all(eventsPolicy.isAllowed)
        .get(events.list)
        .post(events.create);

    // Events collection routes greater than moth
    app.route('/api/events/:monthId1/:monthId2')
        .get(events.listMonth);

    // Events collection routes with focus
    app.route('/api/events/focus')
        .get(events.focus);

    // import from old site
    app.route('/api/events/import')
        .get(events.import);

    // Upload pic

    app.route('/api/events/uploadFile')
        .post(function (req, res) {
            var dir = './public/uploads';

            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }

            dir = './public/uploads/files';

            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }
            dir = './public/uploads/files/' + req.user._id;

            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }
            req.pipe(req.busboy);
            req.busboy.on('file', function (fieldname, file, filename) {
                var fstream = fs.createWriteStream('./public/uploads/files/' + req.user._id + '/' + filename);
                file.pipe(fstream);
                fstream.on('close', function () {
                    res.send({ filename: filename, destination: '/uploads/files/' + req.user._id + '/' });
                });
            });
        });

    app.route('/api/events/uploadPic')
        .post(function (req, res) {
            var dir = './public/uploads';

            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }

            dir = './public/uploads/pics';

            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }
            dir = './public/uploads/pics/' + req.user._id;

            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }

            dir = './public/uploads/pics/' + req.user._id + '/net';

            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }

            dir = './public/uploads/pics/' + req.user._id + '/thumb';

            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }

            req.pipe(req.busboy);
            req.busboy.on('file', function (fieldname, file, filename) {
                var fstream = fs.createWriteStream('./public/uploads/pics/' + req.user._id + '/' + filename);
                file.pipe(fstream);
                fstream.on('close', function () {

                    gm('./public/uploads/pics/' + req.user._id + '/' + filename)
                        .autoOrient()
                        .resize(1140)
                        .gravity('Center')
                        .quality(75)
                        .noProfile()
                        .write('./public/uploads/pics/' + req.user._id + '/net/1200-' + filename, function (err) {
                            if (err) console.log(err);
                        });
                    gm('./public/uploads/pics/' + req.user._id + '/' + filename)
                        .autoOrient()
                        .resize(200)
                        .gravity('Center')
                        .quality(75)
                        .noProfile()
                        .write('./public/uploads/pics/' + req.user._id + '/thumb/200-' + filename, function (err) {
                            if (err) console.log(err);
                        });
                    gm(path.resolve('./public/uploads/pics/' + req.user._id + '/net/1200-' + filename))
                        .size(function (err, size) {
                            if (!err)
                                var orientation = size.width > size.height ? 'landscape' : 'portrait';
                            res.send({ orientation: orientation, filename: '1200-' + filename, thumb: '200-' + filename, destination: '/uploads/pics/' + req.user._id + '/net/', dirthumb: '/uploads/pics/' + req.user._id + '/thumb/' });
                        });
                });
            });
        });
    //

    // Upload gal

    app.route('/api/events/uploadGal/:eventId')
        .post(events.uploadGal);

    // delete
    app.route('/api/events/:eventId/picture/:pictureId')
        .delete(events.deletePicture);

    // apply to event

    app.route('/api/events/apply/:eventId')
        .post(events.apply);

    // Single event routes
    app.route('/api/events/:eventId').all(eventsPolicy.isAllowed)
        .get(events.read)
        .put(events.update)
        .delete(events.delete);

    // Finish by binding the event middleware
    app.param('eventId', events.eventByID);
};
