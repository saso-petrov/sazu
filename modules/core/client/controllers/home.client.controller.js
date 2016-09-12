(function () {
    'use strict';

    angular
        .module('core')
        .controller('HomeController', HomeController);

    HomeController.$inject = ['$scope', '$http', '$filter', 'EventsService'];


    function HomeController($scope, $http, $filter, EventsService) {
        var vm = this;

        vm.events = EventsService.query();

        $scope.jsonData = {};
        var today = new Date().toISOString();


        $scope.now = today.substring(0, 10);


        $scope.yearNow = parseInt(today.substring(0, 4));
        $scope.monthNow = parseInt(today.substring(5, 7));
        // $scope.monthNow = 8;
        $scope.dayNow = parseInt(today.substring(8, 10));

        $scope.noofdays = new Date($scope.yearNow, $scope.monthNow, 0).getDate();


        /*
         var years = {
         'month': 'a',
         'day': 'b'
         };
         */

        var dayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
        var monthNames = ['januar', 'februar', 'marec', 'april', 'maj', 'junij', 'julij', 'august', 'september', 'oktober', 'november', 'december'];


        $scope.months = monthNames;
        $scope.days = dayNames;

        /*
         $scope.exists = function (val) {

         return $filter('filter')($scope.arts, val).length > 0;
         };
         */


        $scope.getDays = function (num) {
            return new Array(num);
        };

        $http.get('/api/events/' + $scope.yearNow + '-' + $scope.monthNow + '/' + (($scope.monthNow === 12) ? $scope.yearNow + 1 : $scope.yearNow) + '-' + (($scope.monthNow === 12) ? 1 : ($scope.monthNow + 1)))
            .then(function (response) {
                $scope.arts = response.data;
                $scope.exists = function (val) {
                    return $filter('filter')($scope.arts, val).length > 0;
                };
            });


        $scope.changeCal = function (num) {

            $scope.monthNow = $scope.monthNow + num;

            if ($scope.monthNow < 1) {
                $scope.yearNow = $scope.yearNow - 1;
                $scope.monthNow = $scope.monthNow = 12;

            }

            if ($scope.monthNow > 12) {
                $scope.yearNow = $scope.yearNow + 1;
                $scope.monthNow = $scope.monthNow = 1;

            }

            $scope.noofdays = new Date($scope.yearNow, $scope.monthNow, 0).getDate();

            $http.get('/api/events/' + $scope.yearNow + '-' + $scope.monthNow + '/' + (($scope.monthNow === 12) ? $scope.yearNow + 1 : $scope.yearNow) + '-' + (($scope.monthNow === 12) ? 1 : ($scope.monthNow + 1)))
                .then(function (response) {
                    $scope.arts = response.data;
                    $scope.exists = function (val) {
                        return $filter('filter')($scope.arts, val).length > 0;
                    };
                });


        };

        // carousel

        $scope.myInterval = 10000;
        $scope.noWrapSlides = false;
        $scope.active = 0;


        $http.get('/api/events/focus')
            .then(function (response) {
                $scope.slides = response.data;
            });
        /*
         var slides = $scope.slides = [];
         var currIndex = 0;

         $scope.addSlide = function () {
         var newWidth = 600 + slides.length + 1;
         slides.push({
         image: '//unsplash.it/' + newWidth + '/300',
         text: ['Nice image', 'Awesome photograph', 'That is so cool', 'I love that'][slides.length % 4],
         id: currIndex++
         });
         };

         $scope.randomize = function () {
         var indexes = generateIndexesArray();
         assignNewIndexesToSlides(indexes);
         };

         for (var i = 0; i < 4; i++) {
         $scope.addSlide();
         }

         // Randomize logic below

         function assignNewIndexesToSlides(indexes) {
         for (var i = 0, l = slides.length; i < l; i++) {
         slides[i].id = indexes.pop();
         }
         }

         function generateIndexesArray() {
         var indexes = [];
         for (var i = 0; i < currIndex; ++i) {
         indexes[i] = i;
         }
         return shuffle(indexes);
         }

         // http://stackoverflow.com/questions/962802#962890
         function shuffle(array) {
         var tmp,
         current,
         top = array.length;

         if (top) {
         while (--top) {
         current = Math.floor(Math.random() * (top + 1));
         tmp = array[current];
         array[current] = array[top];
         array[top] = tmp;
         }
         }

         return array;
         }
         */

    }
}());