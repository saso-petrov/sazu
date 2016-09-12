(function () {
    'use strict';

    angular
        .module('core.admin')
        .run(menuConfig);

    menuConfig.$inject = ['menuService'];

    function menuConfig(menuService) {
        menuService.addMenuItem('topbar', {
            title: 'Admin',
            state: 'admin',
            type: 'dropdown',
            position: 5,
            roles: ['admin']
        });
    }
}());
