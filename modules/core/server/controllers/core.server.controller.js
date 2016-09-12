'use strict';

var validator = require('validator');

/**
 * Render the main application page
 */
exports.renderIndex = function (req, res) {
    var safeUserObject = null;
    if (req.user) {
        safeUserObject = {
            displayName: validator.escape(req.user.displayName),
            provider: validator.escape(req.user.provider),
            username: validator.escape(req.user.username),
            created: req.user.created.toString(),
            roles: req.user.roles,
            profileImageURL: req.user.profileImageURL,
            email: validator.escape(req.user.email),
            lastName: validator.escape(req.user.lastName),
            firstName: validator.escape(req.user.firstName),
            additionalProvidersData: req.user.additionalProvidersData
        };
    }

    res.render('modules/core/server/views/index', {
        user: safeUserObject
    });
};

/**
 * Render the server error page
 */
exports.renderServerError = function (req, res) {
    res.status(500).render('modules/core/server/views/500', {
        error: 'Oops! Something went wrong...'
    });
};

/**
 * Render the server not found responses
 * Performs content-negotiation on the Accept HTTP header
 */
exports.renderNotFound = function (req, res) {

    res.status(404).format({
        'text/html': function () {
            res.render('modules/core/server/views/404', {
                url: req.originalUrl
            });
        },
        'application/json': function () {
            res.json({
                error: 'Path not found'
            });
        },
        'default': function () {
            res.send('Path not found');
        }
    });
};

exports.menu = function (req, res) {
    Array.prototype.last = function () {
        if (this.length === 0) return undefined;
        return this[this.length - 1];
    };


    var lineReader = require('readline').createInterface({
        input: require('fs').createReadStream('file.in')
    });
    var no = 1;
    var tree = [];
    var stack = [tree];
    var lastDepth = 0;
    var currentNode = function () {
        return stack.last();
    };

    function validateDepth(depth, lastDepth) {
        if (depth - lastDepth > 1) throw new Error("Invalid format, can't jump more than one tab in");
    }

    lineReader.on('line', function (line) {
//        console.log('Line from file:', line);

        var name = line.trim();
        if (name.length === 0) return;
        var depth = (line.match(/^\t*/))[0].length;
        var deeper = depth > lastDepth;
        var shallower = depth < lastDepth;
        if (deeper) {
            validateDepth(depth, lastDepth); // check the format is valid
            // convert the last line to a "parent" node
            var parent = currentNode().last();
            parent.children = [];
            // Make that line's children the "current node"
            stack.push(parent.children);
        } else if (shallower) {
            var pops = lastDepth - depth;
            while (pops--) stack.pop();
        }
        lastDepth = depth;
        currentNode().push({ name: name, no: no++ });


    });

    lineReader.on('close', function () {
        res.json(tree);
//        console.log(JSON.stringify(tree, undefined, "  "));
    });
};
