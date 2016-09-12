'use strict';

/**
 * Module dependencies
 */
var documentsPolicy = require('../policies/documents.server.policy'),
    documents = require('../controllers/documents.server.controller');

var fs = require('fs'),
    gm = require('gm');
module.exports = function (app) {
    // Documents collection routes
    app.route('/api/documents').all(documentsPolicy.isAllowed)
        .get(documents.list)
        .post(documents.create);


    // import from old site
    app.route('/api/documents/import')
        .get(documents.import);

    // Upload pic

    app.route('/api/documents/uploadFile')
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
    app.route('/api/documents/uploadPic')
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
                        .resize(1140)
                        .gravity('Center')
                        .quality(75)
                        .noProfile()
                        .write('./public/uploads/pics/' + req.user._id + '/net/1200-' + filename, function (err) {
                            if (err) console.log(err);
                        });
                    gm('./public/uploads/pics/' + req.user._id + '/' + filename)
                        .resize(200)
                        .gravity('Center')
                        .quality(75)
                        .noProfile()
                        .write('./public/uploads/pics/' + req.user._id + '/thumb/200-' + filename, function (err) {
                            if (err) console.log(err);
                        });
                    res.send({ filename: '1200-' + filename, thumb: '200-' + filename, destination: '/uploads/pics/' + req.user._id + '/net/', dirthumb: '/uploads/pics/' + req.user._id + '/thumb/' });
                });
            });
        });
    // Upload gal

    app.route('/api/documents/uploadGal/:documentId')
        .post(documents.uploadGal);

    // delete
    app.route('/api/documents/:documentId/picture/:pictureId')
        .delete(documents.deletePicture);

    // apply to document

    app.route('/api/documents/apply/:documentId')
        .post(documents.apply);

    // Single document routes
    app.route('/api/documents/:documentId').all(documentsPolicy.isAllowed)
        .get(documents.read)
        .put(documents.update)
        .delete(documents.delete);

    // Finish by binding the document middleware
    app.param('documentId', documents.documentByID);
};
