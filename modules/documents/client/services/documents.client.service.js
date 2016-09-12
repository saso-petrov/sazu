(function () {
  'use strict';

  angular
    .module('documents.services')
    .factory('DocumentsService', DocumentsService);

  DocumentsService.$inject = ['$resource'];

  function DocumentsService($resource) {
    return $resource('api/documents/:documentId', {
      documentId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
}());
