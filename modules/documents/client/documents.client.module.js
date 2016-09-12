(function (app) {
  'use strict';

  app.registerModule('documents', ['core']);// The core module is required for special route handling; see /core/client/config/core.client.routes
  app.registerModule('documents.services');
  app.registerModule('documents.routes', ['ui.router', 'core.routes', 'documents.services']);
}(ApplicationConfiguration));
