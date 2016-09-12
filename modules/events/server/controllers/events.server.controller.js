'use strict';

/**
 * Module dependencies
 */
var fs = require('fs'),
    gm = require('gm'),
    _ = require('lodash'),
    path = require('path'),
    http = require('http'),
    async = require('async'),
    config = require(path.resolve('./config/config')),
    mongoose = require('mongoose'),
    Event = mongoose.model('Event'),
    User = mongoose.model('User'),
    nodemailer = require('nodemailer'),
    errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

var smtpTransport = nodemailer.createTransport(config.mailer.options);


// aditional functions

var htmlEnDeCode = (function () {
    var charToEntityRegex,
        entityToCharRegex,
        charToEntity,
        entityToChar;

    function resetCharacterEntities() {
        charToEntity = {};
        entityToChar = {};
        // add the default set
        addCharacterEntities({
            '&amp;': '&',
            '&gt;': '>',
            '&lt;': '<',
            '&quot;': '"',
            '&#39;': "'"
        });
    }

    function addCharacterEntities(newEntities) {
        var charKeys = [],
            entityKeys = [],
            key,
            echar;
        for (key = 0; key < newEntities.length; key++) {
            echar = newEntities[key];
            entityToChar[key] = echar;
            charToEntity[echar] = key;
            charKeys.push(echar);
            entityKeys.push(key);
        }
        charToEntityRegex = new RegExp('(' + charKeys.join('|') + ')', 'g');
        entityToCharRegex = new RegExp('(' + entityKeys.join('|') + '|&#[0-9]{1,5};' + ')', 'g');
    }

    function htmlEncode(value) {
        var htmlEncodeReplaceFn = function (match, capture) {
            return charToEntity[capture];
        };

        return (!value) ? value : String(value).replace(charToEntityRegex, htmlEncodeReplaceFn);
    }

    function htmlDecode(value) {
        var htmlDecodeReplaceFn = function (match, capture) {
            return (capture in entityToChar) ? entityToChar[capture] : String.fromCharCode(parseInt(capture.substr(2), 10));
        };

        return (!value) ? value : String(value).replace(entityToCharRegex, htmlDecodeReplaceFn);
    }

    resetCharacterEntities();

    return {
        htmlEncode: htmlEncode,
        htmlDecode: htmlDecode
    };
})();

function string_to_slug(str) {

    // console.log(htmlEnDeCode.htmlEncode(str));

    str = htmlEnDeCode.htmlDecode(str);

    str = str.replace(/^\s+|\s+$/g, ''); // trim
    str = str.toLowerCase();


    // remove accents, swap ñ for n, etc
    var from = 'ščžŠČŽàáäâèéëêìíïîòóöôùúüûñç·/_,:;';
    var to = 'sczSCZaaaaeeeeiiiioooouuuunc------';
    for (var i = 0, l = from.length; i < l; i++) {
        str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
    }

    str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
        .replace(/\s+/g, '-') // collapse whitespace and replace by -
        .replace(/-+/g, '-'); // collapse dashes

    return str;
}

/**
 * Create an event
 */
exports.create = function (req, res) {
    var event = new Event(req.body);

    event.user = req.user;

    event.slug = string_to_slug(event.title);

    event.save(function (err) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            res.json(event);
        }
    });
};

/**
 * Show the current event
 */
exports.read = function (req, res) {
    // convert mongoose document to JSON
    var event = req.event ? req.event.toJSON() : {};

    // Add a custom field to the Event, for determining if the current User is the "owner".
    // NOTE: This field is NOT persisted to the database, since it doesn't exist in the Event model.

    event.isCurrentUserOwner = req.user !== undefined && event.user && event.user._id.toString() === req.user._id.toString();
    console.log(event.isCurrentUserOwner);

    res.json(event);
};

/**
 * Update an event
 */
exports.update = function (req, res) {

    var event = req.event;


    event.title = req.body.title;
    event.slug = string_to_slug(req.body.title);
    event.content = req.body.content;
    event.focus = req.body.focus;
    event.datefrom = req.body.datefrom;
    event.dateto = req.body.dateto;
    event.image = req.body.image;

    event.save(function (err) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            res.json(event);
        }
    });

};

exports.apply = function (req, res) {

    var event = req.event;


    var user = new User();
    user.provider = 'local';
    user.firstName = req.body.name1;
    user.lastName = req.body.surname1;
    user.email = req.body.email1;
    user.username = req.body.email1;
    user.displayName = user.firstName + ' ' + user.lastName;

    // Then save the user
    user.save(function (err, data) {
        if (err) {
            User.findOne({ email: user.email }).exec(function (err, usdata) {
                Event.findByIdAndUpdate(
                    req.event._id,
                    { $push: { applications: usdata._id } },
                    { safe: true, upsert: true, new: true }).exec(
                    function (err, saved) {


                        res.render(path.resolve('modules/users/server/templates/reset-password-email'), {
                            name: user.displayName // ,
//                            appName: config.app.title,
//                            url: httpTransport + req.headers.host + '/api/auth/reset/' + token
                        }, function (err, emailHTML) {

                            var mailOptions = {
                                to: user.email,
                                from: config.mailer.from,
                                subject: 'Password Reset',
                                html: emailHTML
                            };
                            smtpTransport.sendMail(mailOptions, function (err) {
                                if (!err) {
                                    res.send({
                                        message: 'An email has been sent to the provided email with further instructions.'
                                    });
                                } else {
                                    return res.status(400).send({
                                        message: 'Failure sending email'
                                    });
                                }
                            });
                        });

                        res.json(req.body);
                    }
                );
            });
        } else {
            Event.findByIdAndUpdate(
                req.event._id,
                { $push: { applications: data._id } },
                { safe: true, upsert: true, new: true }).exec(
                function (err, saved) {

                    res.render(path.resolve('modules/users/server/templates/application-email'), {
                        name: user.displayName // ,
//                            appName: config.app.title,
//                            url: httpTransport + req.headers.host + '/api/auth/reset/' + token
                    }, function (err, emailHTML) {

                        var mailOptions = {
                            to: user.email,
                            from: config.mailer.from,
                            subject: 'Application to Bridge Vacations',
                            html: emailHTML
                        };
                        smtpTransport.sendMail(mailOptions, function (err) {
                            if (!err) {
                                res.send({
                                    message: 'An email has been sent to the provided email with further instructions.'
                                });
                            } else {
                                return res.status(400).send({
                                    message: 'Failure sending email'
                                });
                            }
                        });
                    });

                    res.json(req.body);
                }
            );
        }
    });


    /*

     firstName
     lastName
     email
     username
     provider:local

     if (req.body.name1) {
     console.log('YES');

     } else {

     event.title = req.body.title;
     event.slug = string_to_slug(req.body.title);
     event.content = req.body.content;
     event.datefrom = req.body.datefrom;
     event.dateto = req.body.dateto;

     event.save(function (err) {
     if (err) {
     return res.status(400).send({
     message: errorHandler.getErrorMessage(err)
     });
     } else {
     res.json(event);
     }
     });
     }
     */
};

/**
 * Delete an event
 */
exports.delete = function (req, res) {
    var event = req.event;

    event.remove(function (err) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            res.json(event);
        }
    });
};

/**
 * List of Events
 */
exports.list = function (req, res) {
    Event.find().sort('-date').populate('user', 'displayName').exec(function (err, events) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            res.json(events);
        }
    });
};


exports.listMonth = function (req, res) {
    Event.find({ 'date': { '$gte': new Date(req.params.monthId1 + '-01'), '$lt': new Date(req.params.monthId2 + '-01') } })
        .sort('date').populate('user', 'displayName').exec(function (err, events) {
            if (err) {
                return res.status(400).send({
                    message: errorHandler.getErrorMessage(err)
                });
            } else {
                res.json(events);
            }
        });
};

exports.focus = function (req, res) {
    Event.find({ 'focus': true })
        .sort('date').populate('user', 'displayName').exec(function (err, events) {
            if (err) {
                return res.status(400).send({
                    message: errorHandler.getErrorMessage(err)
                });
            } else {
                res.json(events);
            }
        });
};

/**
 * Event middleware
 */
exports.eventByID = function (req, res, next, id) {


    if (mongoose.Types.ObjectId.isValid(id)) {
        Event.findById(id).populate('user', 'displayName').populate('applications', 'displayName').exec(function (err, event) {
            if (err) {
                return next(err);
            } else if (!event) {
                return res.status(404).send({
                    message: 'No event with that identifier has been found'
                });
            }
            req.event = event;
            next();
        });
    } else {
        Event.findOne({ slug: id }).populate('user', 'displayName').populate('applications', 'displayName').exec(function (err, event) {
            if (err) {
                return next(err);
            } else if (!event) {
                return res.status(404).send({
                    message: 'No event with that identifier has been found'
                });
            }
            req.event = event;
            next();
        });


    }
};

exports.deletePicture = function (req, res) {

    var update = {};

    Event.update(
        { _id: req.params.eventId },
        { $pull: { gallery: { _id: req.params.pictureId } } },
        function (err, data) {
            fs.unlink('./public/uploads/gallery/' + req.user._id + '/net/1200-' + req.params.pictureId);
            fs.unlink('./public/uploads/gallery/' + req.user._id + '/thumbs/150-' + req.params.pictureId);
            fs.unlink('./public/uploads/gallery/' + req.user._id + '/' + req.params.pictureId);
            if (err) {
                return res.status(400).send({
                    message: errorHandler.getErrorMessage(err)
                });
            }
        }
    );
};

exports.uploadGal = function (req, res) {

    var dir = './public/uploads';

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }

    dir = './public/uploads/gallery';

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
    dir = './public/uploads/gallery/' + req.user._id;

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }

    dir = './public/uploads/gallery/' + req.user._id + '/thumbs';

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
    dir = './public/uploads/gallery/' + req.user._id + '/net';

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }


    req.pipe(req.busboy);
    req.busboy.on('file', function (fieldname, file, filename) {
        var fstream = fs.createWriteStream('./public/uploads/gallery/' + req.user._id + '/' + filename);

        file.pipe(fstream);
        fstream.on('close', function () {
            gm('./public/uploads/gallery/' + req.user._id + '/' + filename)
                .resize(150)
                .gravity('Center')
                .quality(75)
                .noProfile()
                .write('./public/uploads/gallery/' + req.user._id + '/thumbs/150-' + filename, function (err) {
                    if (err) console.log(err);
                });
            gm('./public/uploads/gallery/' + req.user._id + '/' + filename)
                .resize(1200)
                .gravity('Center')
                .quality(75)
                .noProfile()
                .write('./public/uploads/gallery/' + req.user._id + '/net/1200-' + filename, function (err) {
                    if (err) console.log(err);
                });
            Event.findByIdAndUpdate(
                req.event._id,
                { $push: { gallery: { _id: filename, img: '/uploads/gallery/' + req.user._id + '/net/1200-' + filename, thumb: '/uploads/gallery/' + req.user._id + '/thumbs/150-' + filename } } },
                { safe: true, upsert: true, new: true }).exec(
                function (err, saved) {
                    if (err) {
                        console.log(err);
                        return res.status(400).send({
                            message: errorHandler.getErrorMessage(err)
                        });

                    }
                }
            );

            res.send({ filename: filename });
        });
    });
};



var get_json = function (url, callback) {
    http.get(url, function (res) {
        var body = '';
        res.on('data', function (chunk) {
            body += chunk;
        });

        res.on('end', function () {
            var response = JSON.parse(body);
            callback(response);
        });
    });
};

exports.import = function (req, res) {
    get_json('http://www.sazu.si/json_events.php', function (resp) {
        var cnt = 0;
        async.each(resp, function (obj, callback) {
            console.log(cnt++);
            var event = new Event(obj);
            event.slug = string_to_slug(obj.title);

            event.save(function (err) {
                if (err) {
                    console.log(err);
                    return res.status(400).send({
                        message: errorHandler.getErrorMessage(err)
                    });
                } else {

                }
            });
        });


    });
    return res.redirect('/events');

};