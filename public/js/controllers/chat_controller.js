(function () {
    'use strict';

    angular
        .module('app')
        .controller('chat_controller', function chat_controller($scope, $rootScope, socket, $log, $window, $cookieStore) {
			
			var blurred = false;
			var unseen = 0; //Variable for counting amount of unseen messages.
			var prevMessages = 10000000; //Number of messages to compare with the number of received messages. 
										//Initially high to bar first comparison.
			
			$rootScope.title = ''; //Dynamic title based on number of unseen messages.
			$scope.messages = []; //Message list.
			$scope.chat = {}; //Chat object for sending full JSON data set for user.
			$scope.chat.username = $cookieStore.get('username'); //Retrieve current user name from cookies.
			$scope.chat.avatar = $cookieStore.get('avatar'); //Retrieve user avatar to portray to other users.
			
			//Add current user name to online list on server.
			socket.emit('enter user', $scope.chat.username);
			//Repopulate online list on client side.
			socket.on('get users', function(data){
				$scope.users = data;
				$scope.$apply();
			});
			
			//Request message population. 
			socket.emit('get messages');
			//Clear the message list and wait for updated list.
			socket.on('clear messages', function(){
				if ($scope.messages.length > 0) 
					prevMessages = $scope.messages.length;
				$scope.messages = [];
			});
			//Receive new message list. [One at a time]
			socket.on('receive messages', function(data){
				$scope.messages.push(data);
				if ($scope.messages.length > prevMessages) unseen++;
				if (unseen > 0) {
					$rootScope.title = 'MEANchat (' + unseen + ')';
				} else {
					$rootScope.title = 'MEANchat';
				}
				$scope.$apply();
			});
			
			//Send message to server and go through message repopulation.
			$scope.send = function(){
				if ($scope.chat.message != ""){
					$scope.chat.time = new Date();
					$scope.chat.time = moment.utc($scope.chat.time).format("MM/DD/YYYY HH:mm a");
					socket.emit('send message', $scope.chat);
					socket.emit('get messages');
					$scope.chat.message = "";
					unseen = -1;
				}
			};
			
			//Create private room.
			$scope.privateChat = function(user){
				
			}
			
			//Logout current user.
			$scope.logout = function(){
				$cookieStore.put('auth', false);
				socket.emit('log out', {user: $scope.chat.username});
				socket.emit('disconnect');
			};
			
			//Clear number of unseen messages for title.
			$window.onfocus = function(){
				unseen = 0;
				$rootScope.title = 'MEANchat';
				$rootScope.$apply();
			};
				
        });
})();