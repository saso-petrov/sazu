(function () {
  'use strict';

  angular
    .module('documents')
    .controller('DocumentsListController', DocumentsListController);

  DocumentsListController.$inject = ['DocumentsService'];

  function DocumentsListController(DocumentsService) {
    var vm = this;

    vm.documents = DocumentsService.query();
  }
}());
