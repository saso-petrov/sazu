(function () {
  'use strict';

  describe('Documents Route Tests', function () {
    // Initialize global variables
    var $scope,
      DocumentsService;

    // We can start by loading the main application module
    beforeEach(module(ApplicationConfiguration.applicationModuleName));

    // The injector ignores leading and trailing underscores here (i.e. _$httpBackend_).
    // This allows us to inject a service but then attach it to a variable
    // with the same name as the service.
    beforeEach(inject(function ($rootScope, _DocumentsService_) {
      // Set a new global scope
      $scope = $rootScope.$new();
      DocumentsService = _DocumentsService_;
    }));

    describe('Route Config', function () {
      describe('Main Route', function () {
        var mainstate;
        beforeEach(inject(function ($state) {
          mainstate = $state.get('documents');
        }));

        it('Should have the correct URL', function () {
          expect(mainstate.url).toEqual('/documents');
        });

        it('Should be abstract', function () {
          expect(mainstate.abstract).toBe(true);
        });

        it('Should have template', function () {
          expect(mainstate.template).toBe('<ui-view/>');
        });
      });

      describe('List Route', function () {
        var liststate;
        beforeEach(inject(function ($state) {
          liststate = $state.get('documents.list');
        }));

        it('Should have the correct URL', function () {
          expect(liststate.url).toEqual('');
        });

        it('Should not be abstract', function () {
          expect(liststate.abstract).toBe(undefined);
        });

        it('Should have template', function () {
          expect(liststate.templateUrl).toBe('modules/documents/client/views/list-documents.client.view.html');
        });
      });

      describe('View Route', function () {
        var viewstate,
          DocumentsController,
          mockDocument;

        beforeEach(inject(function ($controller, $state, $templateCache) {
          viewstate = $state.get('documents.view');
          $templateCache.put('modules/documents/client/views/view-document.client.view.html', '');

          // create mock document
          mockDocument = new DocumentsService({
            _id: '525a8422f6d0f87f0e407a33',
            title: 'An Document about MEAN',
            content: 'MEAN rocks!'
          });

          // Initialize Controller
          DocumentsController = $controller('DocumentsController as vm', {
            $scope: $scope,
            documentResolve: mockDocument
          });
        }));

        it('Should have the correct URL', function () {
          expect(viewstate.url).toEqual('/:documentId');
        });

        it('Should have a resolve function', function () {
          expect(typeof viewstate.resolve).toEqual('object');
          expect(typeof viewstate.resolve.documentResolve).toEqual('function');
        });

        it('should respond to URL', inject(function ($state) {
          expect($state.href(viewstate, {
            documentId: 1
          })).toEqual('/documents/1');
        }));

        it('should attach an document to the controller scope', function () {
          expect($scope.vm.document._id).toBe(mockDocument._id);
        });

        it('Should not be abstract', function () {
          expect(viewstate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(viewstate.templateUrl).toBe('modules/documents/client/views/view-document.client.view.html');
        });
      });

      describe('Create Route', function () {
        var createstate,
          DocumentsController,
          mockDocument;

        beforeEach(inject(function ($controller, $state, $templateCache) {
          createstate = $state.get('documents.create');
          $templateCache.put('modules/documents/client/views/form-document.client.view.html', '');

          // create mock document
          mockDocument = new DocumentsService();

          // Initialize Controller
          DocumentsController = $controller('DocumentsController as vm', {
            $scope: $scope,
            documentResolve: mockDocument
          });
        }));

        it('Should have the correct URL', function () {
          expect(createstate.url).toEqual('/create');
        });

        it('Should have a resolve function', function () {
          expect(typeof createstate.resolve).toEqual('object');
          expect(typeof createstate.resolve.documentResolve).toEqual('function');
        });

        it('should respond to URL', inject(function ($state) {
          expect($state.href(createstate)).toEqual('/documents/create');
        }));

        it('should attach an document to the controller scope', function () {
          expect($scope.vm.document._id).toBe(mockDocument._id);
          expect($scope.vm.document._id).toBe(undefined);
        });

        it('Should not be abstract', function () {
          expect(createstate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(createstate.templateUrl).toBe('modules/documents/client/views/form-document.client.view.html');
        });
      });

      describe('Edit Route', function () {
        var editstate,
          DocumentsController,
          mockDocument;

        beforeEach(inject(function ($controller, $state, $templateCache) {
          editstate = $state.get('documents.edit');
          $templateCache.put('modules/documents/client/views/form-document.client.view.html', '');

          // create mock document
          mockDocument = new DocumentsService({
            _id: '525a8422f6d0f87f0e407a33',
            title: 'An Document about MEAN',
            content: 'MEAN rocks!'
          });

          // Initialize Controller
          DocumentsController = $controller('DocumentsController as vm', {
            $scope: $scope,
            documentResolve: mockDocument
          });
        }));

        it('Should have the correct URL', function () {
          expect(editstate.url).toEqual('/:documentId/edit');
        });

        it('Should have a resolve function', function () {
          expect(typeof editstate.resolve).toEqual('object');
          expect(typeof editstate.resolve.documentResolve).toEqual('function');
        });

        it('should respond to URL', inject(function ($state) {
          expect($state.href(editstate, {
            documentId: 1
          })).toEqual('/documents/1/edit');
        }));

        it('should attach an document to the controller scope', function () {
          expect($scope.vm.document._id).toBe(mockDocument._id);
        });

        it('Should not be abstract', function () {
          expect(editstate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(editstate.templateUrl).toBe('modules/documents/client/views/form-document.client.view.html');
        });

        xit('Should go to unauthorized route', function () {

        });
      });

      describe('Handle Trailing Slash', function () {
        beforeEach(inject(function ($state, $rootScope) {
          $state.go('documents.list');
          $rootScope.$digest();
        }));

        it('Should remove trailing slash', inject(function ($state, $location, $rootScope) {
          $location.path('documents/');
          $rootScope.$digest();

          expect($location.path()).toBe('/documents');
          expect($state.current.templateUrl).toBe('modules/documents/client/views/list-documents.client.view.html');
        }));
      });

    });
  });
}());
