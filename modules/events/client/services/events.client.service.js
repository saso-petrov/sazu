(function () {
  'use strict';

  angular
    .module('events.services')
    .factory('EventsService', EventsService);

  EventsService.$inject = ['$resource'];

  function EventsService($resource) {
    return $resource('api/events/:eventId', {
      eventId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
}());
