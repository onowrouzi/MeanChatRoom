(function () {
    'use strict';

angular.module('app', ['ui.router', 'ui.bootstrap', 'angularMoment', 'ngCookies', 'luegg.directives'])
	//Window focus event and title initializer.
	.run(function($rootScope){
		$rootScope.title = "MEANchat";
		
		$rootScope.onFocus = function($event){
			$rootScope.blurred = false;
		};
	})
	//Inject socket factory for use in Angular.
	.factory('socket', ['$rootScope', function($rootScope){
		var socket = io.connect();
		
		return {
			on: function(evt, callback){
				socket.on(evt, callback);
			},
			emit: function(evt, data){
				socket.emit(evt, data);
			}
		};
	}]);
})();