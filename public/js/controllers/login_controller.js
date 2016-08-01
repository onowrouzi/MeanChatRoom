(function () {
    'use strict';

    angular
        .module('app')
        .controller('login_controller', function login_controller($scope, $rootScope, $state, $http, $log, $cookieStore) {
			
			$scope.login = function(user) {
				$http.post("/users/login", user)
					.success(function(data, status){
						console.log(data);
						$cookieStore.put('auth', true);
						$cookieStore.put('username', data.username);
						if (data.avatar) {
							$cookieStore.put('avatar', data.avatar);
						} else {
							$cookieStore.put('avatar', "https://upload.wikimedia.org/wikipedia/commons/7/70/User_icon_BLACK-01.png");
						}
						$state.go('chat');
					})
					.error(function (data, status, headers, config, statusTxt) {
						console.log("Error: " + data);
						console.log(config);
						$scope.error = true;
					});
			};
			
        });
})();
