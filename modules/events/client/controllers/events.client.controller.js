/* global tinymce,$*/
(function () {
    'use strict';


    angular
        .module('events')
        .controller('EventsController', EventsController);

    EventsController.$inject = ['$scope', '$http', '$state', '$stateParams', '$timeout', 'eventResolve', '$window', 'Authentication', 'FileUploader', 'Upload'];

    function EventsController($scope, $http, $state, $stateParams, $timeout, event, $window, Authentication, FileUploader, Upload) {
        var vm = this;


        vm.event = event;
        vm.authentication = Authentication;
        vm.error = null;
        vm.form = {};

        $scope.now = new Date().toISOString().slice(0, 10);

        vm.remove = remove;
        vm.save = save;

        vm.saveApply = saveApply;

        if (vm.event.datefrom !== undefined) {
            vm.event.datefromNormal = vm.event.datefrom;
            vm.event.datefrom = new Date(vm.event.datefrom);
            vm.event.dateto = new Date(vm.event.dateto);
        }

        // tinymce

        $scope.tinymceModel = 'Initial content';

        $scope.files = [];

// listen for the file selected event
        $scope.$on('fileSelected', function (event, args) {
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

                var filebrowser = '/modules/events/client/views/modals/upload.html';
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

                    filebrowser = '/modules/events/client/views/modals/uploadfile.html';
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
        $scope.events = [
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

                for (var i = 0; i < $scope.events.length; i++) {
                    var currentDay = new Date($scope.events[i].date).setHours(0, 0, 0, 0);

                    if (dayToCheck === currentDay) {
                        return $scope.events[i].status;
                    }
                }
            }

            return '';
        }


        // images

        vm.imageURL = vm.event.profileImageURL;
        vm.uploadProfilePicture = uploadProfilePicture;

        vm.cancelUpload = cancelUpload;
        // Create file uploader instance

        vm.uploader = new FileUploader({
            url: '/api/events/pictures/' + $stateParams.eventId,
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

                fileReader.onload = function (fileReaderEvent) {
                    $timeout(function () {
                        vm.imageURL = fileReaderEvent.target.result;
                    }, 0);
                };
            }
        }

        // Called after the user has successfully uploaded a new picture
        function onSuccessItem(fileItem, response, status, headers) {
            // Show success message
            vm.success = true;

            // Populate user object
            vm.event = response;

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
            vm.imageURL = vm.event.profileImageURL;
        }


        /**
         * FileUploader
         * @type {string}
         */

        var uploader = $scope.uploader = new FileUploader({
            url: '/api/events/uploadGal/' + $stateParams.eventId
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

            $http.get('/api/events/' + $stateParams.eventId)
                .then(function (response) {
                    vm.event = response.data;
                });

            /*   $scope.event = vm.event.get({
             eventId: $stateParams.eventId
             }); */
        };
        uploader.onCompleteAll = function () {
            console.info('onCompleteAll');
            /*  $scope.event = vm.event.get({
             eventId: $stateParams.eventId
             }); */
        };


        /**
         *  end FileUploader
         */

            // delete img

        $scope.deleteImage = function (i) {
            $http.delete('/api/events/' + event._id + '/picture/' + vm.event.gallery[i]._id);

        };


        // Remove existing Event
        function remove() {
            if ($window.confirm('Are you sure you want to delete?')) {
                vm.event.$remove($state.go('events.list'));
            }
        }

        // Save Event
        function save(isValid) {
            if (!isValid) {
                $scope.$broadcast('show-errors-check-validity', 'vm.form.eventForm');
                return false;
            }

            var data = {
                images: $scope.files
            };

            Upload.upload({
                url: 'api/events/uploadPic',
                data: data,
                method: 'POST',
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            }).success(function (data) {

                console.log(data);
                vm.event.image = { orientation: data.orientation, file: data.filename, destination: data.destination, thumb: data.thumb, dirthumb: data.dirthumb };
                event.$update(successCallback, errorCallback);
            });

            // TODO: move create/update logic to service
            if (vm.event._id) {
                vm.event.$update(successCallback, errorCallback);
            } else {
                vm.event.$save(successCallback, errorCallback);
            }

            function successCallback(res) {
                $state.go('events.view', {
                    eventId: res._id
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

            $http.post('/api/events/apply/' + $stateParams.eventId, vm.event)
                .success(function (response) {
                    $scope.applysuccess = response.name1 + ' ' + response.surname1 + ', you are successfully registered to the event!';
                    //  vm.event = response.data;
                });

            /*
             if (vm.event._id) {
             vm.event.$update(successCallback, errorCallback);
             } else {
             vm.event.$save(successCallback, errorCallback);
             }

             function successCallback(res) {
             $state.go('events.view', {
             eventId: res._id
             });
             }

             function errorCallback(res) {
             vm.error = res.data.message;
             }
             */
        }

    }
}());
