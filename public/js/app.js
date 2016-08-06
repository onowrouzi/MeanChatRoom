(function () {
    'use strict';

angular.module('app', ['ui.router', 'ui.bootstrap', 'angularMoment', 'ngCookies', 'ngIdle', 'luegg.directives'])
	//Window focus and idle event and title initializer.
	.run(function($rootScope){
		$rootScope.title = "MEANchat";
		
		$rootScope.onFocus = function($event){
			$rootScope.blurred = false;
		};
	})
	//Configure idle/timeout timers.
	.config(['IdleProvider', 'KeepaliveProvider', function(IdleProvider, KeepaliveProvider){
		IdleProvider.idle(10*60);
		IdleProvider.timeout(20*60);
		KeepaliveProvider.interval(10);
	}])
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