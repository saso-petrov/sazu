(function () {
    'use strict';

    angular
        .module('documents.routes')
        .config(routeConfig);

    routeConfig.$inject = ['$stateProvider'];

    function routeConfig($stateProvider) {
        $stateProvider
            .state('documents', {
                abstract: true,
                url: '/documents/',
                template: '<ui-view/>'
            })
            .state('documents.list', {
                url: '',
                templateUrl: 'modules/documents/client/views/list-documents.client.view.html',
                controller: 'DocumentsListController',
                controllerAs: 'vm',
                data: {
                    pageTitle: 'Documents List'
                }
            })
            .state('documents.create', {
                url: 'create',
                templateUrl: 'modules/documents/client/views/form-document.client.view.html',
                controller: 'DocumentsController',
                controllerAs: 'vm',
                resolve: {
                    documentResolve: newDocument
                },
                data: {
                    roles: ['editor', 'admin'],
                    pageTitle: 'Documents Create'
                }
            })
            .state('documents.edit', {
                url: ':documentId/edit',
                templateUrl: 'modules/documents/client/views/form-document.client.view.html',
                controller: 'DocumentsController',
                controllerAs: 'vm',
                resolve: {
                    documentResolve: getDocument
                },
                data: {
                    roles: ['editor', 'admin'],
                    pageTitle: 'Edit Document {{ documentResolve.title }}'
                }
            })

            .state('documents.view', {
                url: ':documentId',
                templateUrl: 'modules/documents/client/views/view-document.client.view.html',
                controller: 'DocumentsController',
                controllerAs: 'vm',
                resolve: {
                    documentResolve: getDocument
                },
                data: {
                    pageTitle: 'Document {{ documentResolve.title }}'
                }
            })

    }

    getDocument.$inject = ['$stateParams', 'DocumentsService'];

    function getDocument($stateParams, DocumentsService) {
        return DocumentsService.get({
            documentId: $stateParams.documentId
        }).$promise;
    }

    newDocument.$inject = ['DocumentsService'];

    function newDocument(DocumentsService) {
        return new DocumentsService();
    }
}());
