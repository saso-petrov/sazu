'use strict';

angular.module('core').controller('FooterController', ['$scope', '$state', 'Authentication',
    function ($scope, $state, Authentication) {
        var vm = this;
        vm.authentication = Authentication;
        vm.isCollapsed = false;
        // Expose view variables
        $scope.$state = $state;
        $scope.authentication = Authentication;


        // Toggle the menu items
        $scope.isCollapsed = false;
        $scope.toggleCollapsibleMenu = function () {
            $scope.isCollapsed = !$scope.isCollapsed;
        };

        // Collapsing the menu after navigation
        $scope.$on('$stateChangeSuccess', function () {
            $scope.isCollapsed = false;
        });
    }
]);
