'use strict';

/**
 * Module dependencies
 */
var acl = require('acl');

// Using the memory backend
acl = new acl(new acl.memoryBackend());

/**
 * Invoke Documents Permissions
 */
exports.invokeRolesPolicies = function () {
  acl.allow([{
    roles: ['admin'],
    allows: [{
      resources: '/api/documents',
      permissions: '*'
    }, {
      resources: '/api/documents/:documentId',
      permissions: '*'
    }]
  }, {
    roles: ['editor'],
    allows: [{
      resources: '/api/documents',
      permissions: ['get', 'post']
    }, {
      resources: '/api/documents/:documentId',
      permissions: ['get']
    }]
  }, {
    roles: ['guest', 'user'],
    allows: [{
      resources: '/api/documents',
      permissions: ['get']
    }, {
      resources: '/api/documents/:documentId',
      permissions: ['get']
    }]
  }]);
};

/**
 * Check If Documents Policy Allows
 */
exports.isAllowed = function (req, res, next) {
  var roles = (req.user) ? req.user.roles : ['guest', 'user'];

  // If an document is being processed and the current user created it then allow any manipulation
  if (req.document && req.user && req.document.user && req.document.user.id === req.user.id) {
    return next();
  }

  // Check for user roles
  acl.areAnyRolesAllowed(roles, req.route.path, req.method.toLowerCase(), function (err, isAllowed) {
    if (err) {
      // An authorization error occurred
      return res.status(500).send('Unexpected authorization error');
    } else {
      if (isAllowed) {
        // Access granted! Invoke next middleware
        return next();
      } else {
        return res.status(403).json({
          message: 'User is not authorized'
        });
      }
    }
  });
};
