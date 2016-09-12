/* global tinymce,$*/
(function () {
    'use strict';


    angular
        .module('documents')
        .controller('DocumentsController', DocumentsController);

    DocumentsController.$inject = ['$scope', '$http', '$state', '$stateParams', '$timeout', 'documentResolve', '$window', 'Authentication', 'FileUploader'];

    function DocumentsController($scope, $http, $state, $stateParams, $timeout, document, $window, Authentication, FileUploader) {
        var vm = this;


        vm.document = document;
        vm.authentication = Authentication;
        vm.error = null;
        vm.form = {};

        $scope.now = new Date().toISOString().slice(0, 10);

        vm.remove = remove;
        vm.save = save;

        vm.saveApply = saveApply;

        if (vm.document.datefrom !== undefined) {
            vm.document.datefromNormal = vm.document.datefrom;
            vm.document.datefrom = new Date(vm.document.datefrom);
            vm.document.dateto = new Date(vm.document.dateto);
        }

        // tinymce

        $scope.tinymceModel = 'Initial content';

        $scope.files = [];

// listen for the file selected document
        $scope.$on("fileSelected", function (document, args) {
            $scope.$apply(function () {
                // add the file object to the scope's files collection
                $scope.files.push(args.file);
            });
        });

        $scope.tinymceOptions = {
            plugins: 'link image imagetools code visualblocks fullscreen autoresize',
            toolbar: 'undo redo | bold italic | alignleft aligncenter alignright | visualblocks code fullscreen ',
            relative_urls: false,
            remove_script_host: false,
            convert_urls: true,
            visualblocks_default_state: false,
            content_css: '/lib/bootstrap/dist/css/bootstrap.css',
            extended_valid_elements: 'a[href|target=_blank]',
            image_dimensions: true,
            image_class_list: [
                { title: 'Responsive', value: 'img-responsive' },
                { title: '-', value: '' }
            ],

            file_browser_callback: function (field_name, url, type, win) {

                var filebrowser = '/modules/documents/client/views/modals/upload.html';
                if (type === 'image') {

                    filebrowser += (filebrowser.indexOf('?') < 0) ? '?type=' + type : '&type=' + type;
                    tinymce.activeEditor.windowManager.open({
                        title: 'Insert image',
                        width: 520,
                        height: 400,
                        url: filebrowser
                    }, {
                        window: win,
                        input: field_name
                    });
                }
                else if (type === 'file') {

                    filebrowser = '/modules/documents/client/views/modals/uploadfile.html';
                    filebrowser += (filebrowser.indexOf('?') < 0) ? '?type=' + type : '&type=' + type;
                    tinymce.activeEditor.windowManager.open({
                        title: 'Insert file',
                        width: 520,
                        height: 400,
                        url: filebrowser
                    }, {
                        window: win,
                        input: field_name
                    });

                }
                return false;
            }
        };

        // datepicker

        $scope.today = function () {
            $scope.dt = new Date();
        };
        $scope.today();

        $scope.clear = function () {
            $scope.dt = null;
        };

        $scope.inlineOptions = {
            customClass: getDayClass,
            minDate: new Date(),
            showWeeks: true
        };

        $scope.dateOptions = {
            //   dateDisabled: disabled,
            formatYear: 'yy',
            maxDate: new Date(2020, 5, 22),
            minDate: new Date(),
            startingDay: 1
        };

        // Disable weekend selection
        function disabled(data) {
            var date = data.date,
                mode = data.mode;
            return mode === 'day' && (date.getDay() === 0 || date.getDay() === 6);
        }

        $scope.toggleMin = function () {
            $scope.inlineOptions.minDate = $scope.inlineOptions.minDate ? null : new Date();
            $scope.dateOptions.minDate = $scope.inlineOptions.minDate;
        };

        $scope.toggleMin();

        $scope.open1 = function () {
            $scope.popup1.opened = true;
        };

        $scope.open2 = function () {
            $scope.popup2.opened = true;
        };

        $scope.setDate = function (year, month, day) {
            $scope.dt = new Date(year, month, day);
        };

        $scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd/MM/yyyy', 'shortDate'];
        $scope.format = $scope.formats[2];
        $scope.altInputFormats = ['M!/d!/yyyy'];

        $scope.popup1 = {
            opened: false
        };

        $scope.popup2 = {
            opened: false
        };

        var tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        var afterTomorrow = new Date();
        afterTomorrow.setDate(tomorrow.getDate() + 1);
        $scope.documents = [
            {
                date: tomorrow,
                status: 'full'
            },
            {
                date: afterTomorrow,
                status: 'partially'
            }
        ];

        function getDayClass(data) {
            var date = data.date,
                mode = data.mode;
            if (mode === 'day') {
                var dayToCheck = new Date(date).setHours(0, 0, 0, 0);

                for (var i = 0; i < $scope.documents.length; i++) {
                    var currentDay = new Date($scope.documents[i].date).setHours(0, 0, 0, 0);

                    if (dayToCheck === currentDay) {
                        return $scope.documents[i].status;
                    }
                }
            }

            return '';
        }


        // images

        vm.imageURL = vm.document.profileImageURL;
        vm.uploadProfilePicture = uploadProfilePicture;

        vm.cancelUpload = cancelUpload;
        // Create file uploader instance

        vm.uploader = new FileUploader({
            url: '/api/documents/pictures/' + $stateParams.documentId,
            alias: 'newProfilePicture',
            onAfterAddingFile: onAfterAddingFile,
            onSuccessItem: onSuccessItem,
            onErrorItem: onErrorItem
        });

        // Set file uploader image filter
        vm.uploader.filters.push({
            name: 'imageFilter',
            fn: function (item, options) {
                var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
                return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
            }
        });

        // Called after the user selected a new picture file
        function onAfterAddingFile(fileItem) {
            if ($window.FileReader) {
                var fileReader = new FileReader();
                fileReader.readAsDataURL(fileItem._file);

                fileReader.onload = function (fileReaderDocument) {
                    $timeout(function () {
                        vm.imageURL = fileReaderDocument.target.result;
                    }, 0);
                };
            }
        }

        // Called after the user has successfully uploaded a new picture
        function onSuccessItem(fileItem, response, status, headers) {
            // Show success message
            vm.success = true;

            // Populate user object
            vm.document = response;

            // Clear upload buttons
            cancelUpload();
        }

        // Called after the user has failed to uploaded a new picture
        function onErrorItem(fileItem, response, status, headers) {
            // Clear upload buttons
            cancelUpload();

            // Show error message
            vm.error = response.message;
        }

        // Change user profile picture
        function uploadProfilePicture() {
            // Clear messages
            vm.success = vm.error = null;

            // Start upload
            vm.uploader.uploadAll();
        }

        // Cancel the upload process
        function cancelUpload() {
            vm.uploader.clearQueue();
            vm.imageURL = vm.document.profileImageURL;
        }


        /**
         * FileUploader
         * @type {string}
         */

        var uploader = $scope.uploader = new FileUploader({
            url: '/api/documents/uploadGal/' + $stateParams.documentId
        });

        // FILTERS

        uploader.filters.push({
            name: 'imageFilter',
            fn: function (item /* {File|FileLikeObject} */, options) {
                var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
                return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
            }
        });

        // CALLBACKS


        uploader.onCompleteItem = function (fileItem, response, status, headers) {
            console.info('onCompleteItem', fileItem, response, status, headers);

            $http.get('/api/documents/' + $stateParams.documentId)
                .then(function (response) {
                    vm.document = response.data;
                });

            /*   $scope.document = vm.document.get({
             documentId: $stateParams.documentId
             }); */
        };
        uploader.onCompleteAll = function () {
            console.info('onCompleteAll');
            /*  $scope.document = vm.document.get({
             documentId: $stateParams.documentId
             }); */
        };


        /**
         *  end FileUploader
         */

            // delete img

        $scope.deleteImage = function (i) {
            $http.delete('/api/documents/' + document._id + '/picture/' + vm.document.gallery[i]._id);

        };


        // Remove existing Document
        function remove() {
            if ($window.confirm('Are you sure you want to delete?')) {
                vm.document.$remove($state.go('documents.list'));
            }
        }

        // Save Document
        function save(isValid) {
            if (!isValid) {
                $scope.$broadcast('show-errors-check-validity', 'vm.form.documentForm');
                return false;
            }

            // TODO: move create/update logic to service
            if (vm.document._id) {
                vm.document.$update(successCallback, errorCallback);
            } else {
                vm.document.$save(successCallback, errorCallback);
            }

            function successCallback(res) {
                $state.go('documents.view', {
                    documentId: res._id
                });
            }

            function errorCallback(res) {
                vm.error = res.data.message;
            }
        }

        // Save Apply
        function saveApply(isValid) {
            if (!isValid) {
                $scope.$broadcast('show-errors-check-validity', 'vm.form.saveApply');
                return false;
            }

            // TODO: move create/update logic to service

            $http.post('/api/documents/apply/' + $stateParams.documentId, vm.document)
                .success(function (response) {
                    $scope.applysuccess = response.name1 + ' '+ response.surname1 + ', you are successfully registered to the document!';
                  //  vm.document = response.data;
                });

            /*
            if (vm.document._id) {
                vm.document.$update(successCallback, errorCallback);
            } else {
                vm.document.$save(successCallback, errorCallback);
            }

            function successCallback(res) {
                $state.go('documents.view', {
                    documentId: res._id
                });
            }

            function errorCallback(res) {
                vm.error = res.data.message;
            }
            */
        }

    }
}());
