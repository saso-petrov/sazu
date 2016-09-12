/* eslint guard-for-in: 0*/
'use strict';

angular.module('core').filter('unsafe', function ($sce) {
    return $sce.trustAsHtml;
});

angular.module('core').filter('percentage', ['$filter', function ($filter) {
    return function (input, decimals) {
        return $filter('number')(input, decimals) + '%';
    };
}]);

angular.module('core').filter('object2Array', function () {
    return function (input) {
        var out = [];
        for (var i in input) {
            out.push(input[i]);
        }
        return out;
    };
});
angular.module('core').filter('setDecimal', function ($filter) {
    return function (input, places) {
        if (isNaN(input)) return input;
        var factor = '1' + new Array(+(places > 0 && places + 1)).join('0');
        return Math.round(input * factor) / factor;
    };
});
angular.module('core').filter('filterOR', function () {
    return function (input, fields, value) {
        var out = [];
        for (var i in input) {
            for (var j in fields) {
                if (input[i][fields[j]] !== undefined && input[i][fields[j]] === value) {

                    out.push(input[i]);
                }
            }

        }
        return out;
    };
});