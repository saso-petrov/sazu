(function () {
  'use strict';

  describe('Documents Controller Tests', function () {
    // Initialize global variables
    var DocumentsController,
      $scope,
      $httpBackend,
      $state,
      Authentication,
      DocumentsService,
      mockDocument;

    // The $resource service augments the response object with methods for updating and deleting the resource.
    // If we were to use the standard toEqual matcher, our tests would fail because the test values would not match
    // the responses exactly. To solve the problem, we define a new toEqualData Jasmine matcher.
    // When the toEqualData matcher compares two objects, it takes only object properties into
    // account and ignores methods.
    beforeEach(function () {
      jasmine.addMatchers({
        toEqualData: function (util, customEqualityTesters) {
          return {
            compare: function (actual, expected) {
              return {
                pass: angular.equals(actual, expected)
              };
            }
          };
        }
      });
    });

    // Then we can start by loading the main application module
    beforeEach(module(ApplicationConfiguration.applicationModuleName));

    // The injector ignores leading and trailing underscores here (i.e. _$httpBackend_).
    // This allows us to inject a service but then attach it to a variable
    // with the same name as the service.
    beforeEach(inject(function ($controller, $rootScope, _$state_, _$httpBackend_, _Authentication_, _DocumentsService_) {
      // Set a new global scope
      $scope = $rootScope.$new();

      // Point global variables to injected services
      $httpBackend = _$httpBackend_;
      $state = _$state_;
      Authentication = _Authentication_;
      DocumentsService = _DocumentsService_;

      // create mock document
      mockDocument = new DocumentsService({
        _id: '525a8422f6d0f87f0e407a33',
        title: 'An Document about MEAN',
        content: 'MEAN rocks!'
      });

      // Mock logged in user
      Authentication.user = {
        roles: ['editor']
      };

      // Initialize the Documents controller.
      DocumentsController = $controller('DocumentsController as vm', {
        $scope: $scope,
        documentResolve: {}
      });

      // Spy on state go
      spyOn($state, 'go');
    }));

    describe('vm.save() as create', function () {
      var sampleDocumentPostData;

      beforeEach(function () {
        // Create a sample document object
        sampleDocumentPostData = new DocumentsService({
          title: 'An Document about MEAN',
          content: 'MEAN rocks!'
        });

        $scope.vm.document = sampleDocumentPostData;
      });

      it('should send a POST request with the form input values and then locate to new object URL', inject(function (DocumentsService) {
        // Set POST response
        $httpBackend.expectPOST('api/documents', sampleDocumentPostData).respond(mockDocument);

        // Run controller functionality
        $scope.vm.save(true);
        $httpBackend.flush();

        // Test URL redirection after the document was created
        expect($state.go).toHaveBeenCalledWith('documents.view', {
          documentId: mockDocument._id
        });
      }));

      it('should set $scope.vm.error if error', function () {
        var errorMessage = 'this is an error message';
        $httpBackend.expectPOST('api/documents', sampleDocumentPostData).respond(400, {
          message: errorMessage
        });

        $scope.vm.save(true);
        $httpBackend.flush();

        expect($scope.vm.error).toBe(errorMessage);
      });
    });

    describe('vm.save() as update', function () {
      beforeEach(function () {
        // Mock document in $scope
        $scope.vm.document = mockDocument;
      });

      it('should update a valid document', inject(function (DocumentsService) {
        // Set PUT response
        $httpBackend.expectPUT(/api\/documents\/([0-9a-fA-F]{24})$/).respond();

        // Run controller functionality
        $scope.vm.save(true);
        $httpBackend.flush();

        // Test URL location to new object
        expect($state.go).toHaveBeenCalledWith('documents.view', {
          documentId: mockDocument._id
        });
      }));

      it('should set $scope.vm.error if error', inject(function (DocumentsService) {
        var errorMessage = 'error';
        $httpBackend.expectPUT(/api\/documents\/([0-9a-fA-F]{24})$/).respond(400, {
          message: errorMessage
        });

        $scope.vm.save(true);
        $httpBackend.flush();

        expect($scope.vm.error).toBe(errorMessage);
      }));
    });

    describe('vm.remove()', function () {
      beforeEach(function () {
        // Setup documents
        $scope.vm.document = mockDocument;
      });

      it('should delete the document and redirect to documents', function () {
        // Return true on confirm message
        spyOn(window, 'confirm').and.returnValue(true);

        $httpBackend.expectDELETE(/api\/documents\/([0-9a-fA-F]{24})$/).respond(204);

        $scope.vm.remove();
        $httpBackend.flush();

        expect($state.go).toHaveBeenCalledWith('documents.list');
      });

      it('should should not delete the document and not redirect', function () {
        // Return false on confirm message
        spyOn(window, 'confirm').and.returnValue(false);

        $scope.vm.remove();

        expect($state.go).not.toHaveBeenCalled();
      });
    });
  });
}());
