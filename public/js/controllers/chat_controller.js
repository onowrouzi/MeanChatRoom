(function () {
    'use strict';

    angular
        .module('app')
        .controller('chat_controller', function chat_controller($scope, socket, $log, $cookieStore) {
			
			$scope.messages = []; //Message list.
			$scope.chat = {}; //Chat object for sending full JSON data set for user.
			$scope.chat.username = $cookieStore.get('username'); //Retrieve current user name from cookies.
			
			//Add current user name to online list on server.
			socket.emit('enter user', $scope.chat.username);
			//Repopulate online list on client side.
			socket.on('get users', function(data){
				$scope.users = data;
				console.log(data);
				$scope.$apply();
			});
			
			//Request message population. 
			socket.emit('get messages');
			//Clear the message list and wait for updated list.
			socket.on('clear messages', function(){
				$scope.messages = [];
			});
			//Receive new message list. [One at a time]
			socket.on('receive messages', function(data){
				$scope.messages.push(data);
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
				
        });
})();