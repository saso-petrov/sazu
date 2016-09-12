(function () {
    'use strict';

    angular
        .module('core')
        .controller('HeaderController', HeaderController);

    HeaderController.$inject = ['$scope', '$state', '$window', '$http', 'Authentication', 'menuService'];

    function HeaderController($scope, $state, $window, $http, Authentication, menuService) {
        var vm = this;

        $scope.$window = $window;

        vm.accountMenu = menuService.getMenu('account').items[0];
        vm.authentication = Authentication;
        vm.isCollapsed = false;
        vm.menu = menuService.getMenu('topbar');

        $scope.$on('$stateChangeSuccess', stateChangeSuccess);

        function stateChangeSuccess() {
            // Collapsing the menu after navigation
            vm.isCollapsed = false;
        }

        $scope.isdivOpen = [];

        $scope.toggleOSazu = function (no) {

            // if undefined

            if ($scope.isdivOpen[no] === undefined)
                $scope.isdivOpen[no] = false;


            // reset
            var temp = $scope.isdivOpen[no];
            $scope.isdivOpen = [];

            $scope.isdivOpen[no] = temp;
            $scope.isdivOpen[no] = !$scope.isdivOpen[no];

            if ($scope.isdivOpen[no]) {
                $scope.$window.onclick = function (event) {
                    closeSearchWhenClickingElsewhere(event, $scope.toggleOSazu);
                };

            } else {
                $scope.isdivOpen[no] = false;
                $scope.$window.onclick = null;
                $scope.$apply();
            }

        };

        function closeSearchWhenClickingElsewhere(event, callbackOnClose) {

            var clickedElement = event.target;
            if (!clickedElement) return;

            var elementClasses = clickedElement.classList;
            var clickedOnSearchDrawer = elementClasses.contains('handle-right') || elementClasses.contains('drawer-right') || (clickedElement.parentElement !== null && clickedElement.parentElement.classList.contains('drawer-right'));

            if (!clickedOnSearchDrawer) {
                callbackOnClose();
                return;
            }

        }


        $http.get('/menu')
            .then(function (response) {
                $scope.sazuMenu = response.data;
            });
    }
}());
