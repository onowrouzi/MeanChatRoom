(function () {
    'use strict';

    angular
        .module('app')
        .controller('chat_controller', function chat_controller($scope, $rootScope, socket, $log, $window, $cookieStore) {
			
			//------------------START OF INITIAL VARIABLE POPULATION------------------//
			$scope.recipients = $cookieStore.get('recipients');  //Recipients in current chat.
			var unseen = 0; //Variable for counting amount of unseen messages.
			var prevMessages = 10000000; //Number of messages to compare with the number of received messages. 
										//Initially high to bar first comparison.
			
			$rootScope.title = 'MEANchat'; //Dynamic title based on number of unseen messages.
			$scope.messages = []; //Message list.
			$scope.chat = {}; //Chat object for sending full JSON data set for user.
			$scope.chat.username = $cookieStore.get('username'); //Retrieve current user name from cookies.
			$scope.chat.avatar = $cookieStore.get('avatar'); //Retrieve user avatar to portray to other users.
			$scope.chat.isPrivate = $cookieStore.get('isPrivate'); //Retrieve status of private messaging.
			$scope.chat.receiver = $cookieStore.get('receiver'); //Retrieve receiver of private messages if there is one.
			//-------------------END OF INITIAL VARIABLE POPULATION------------------//
			
			
			//------------------ START OF USER LIST POPULATION------------------//
			//Add current user name to online list on server.
			socket.emit('enter user', $scope.chat.username);
			//Retrieve current users.
			if ($cookieStore.get('users') == '') {
				$scope.users = [];
				socket.emit('check users', $scope.chat); 
			} else {
				$scope.users = $cookieStore.get('users');
			}
			//Repopulate online list on client side.
			socket.on('get users', function(data){
				for (var i = 0; i < data.length; i++){
					$scope.users.push({username: data[i], request: false});
				}
				$cookieStore.put('users', $scope.users);
				$scope.$apply();
			});
			//Add user on entrance.
			socket.on('add user', function(data){
				var exists = findUser(data);
				if (exists == -1) {
					$scope.users.push({username: data, request: false});
					$cookieStore.put('users', $scope.users);
				}
			});
			//-------------------END OF USER LIST POPULATION------------------//
			
			
			//-------------------START OF MESSAGE POPULATION------------------//
			//Request message population. 
			function getMessages(){
				if ($scope.chat.isPrivate) {
					socket.emit('get private messages', $scope.chat);
				} else {
					socket.emit('get messages', $scope.chat);
				}
			}
			getMessages();
			//Receive new message list. [One at a time]
			socket.on('receive messages', function(data){
				if (!$scope.chat.isPrivate){
					$scope.messages.push(data);
					$scope.$apply();
				} 
			});
			//Receive new private message list. [One at a time]
			socket.on('receive private messages', function(data){
				if ($scope.chat.isPrivate){
					$scope.messages.push(data);
					$scope.$apply();
				} 
			});
			//Receive new message.
			socket.on('new message', function(data){
				if (data.isPrivate == $scope.chat.isPrivate){
					if (!data.isPrivate || (data.username == $scope.chat.username   && data.receiver == $scope.chat.receiver) 
						|| (data.receiver == $scope.chat.username && data.username == $scope.chat.receiver)) { 
						$scope.messages.push(data);
						unseen++;
						$rootScope.title = 'MEANchat (' + unseen + ')';
						$scope.$apply();
					}
				} 
			});
			//---------------------END OF MESSAGE POPULATION------------------//
			
			
			//Notify user of private message.
			socket.on('private notification', function(data){
				if (data != $scope.chat.receiver) {
					var index = findUser(data);
					if (index != -1) $scope.users[index].request = true;
					$cookieStore.put('users', $scope.users);
					$scope.$apply();
				}
			});
			
			//Initiate private chat.
			$scope.setPrivate = function(user){
				user.request = false;
				$cookieStore.put('users', $scope.users);
				$scope.recipients = user.username;
				$cookieStore.put('recipients', user.username);
				$scope.chat.receiver = user.username;
				$cookieStore.put('receiver', user.username);
				$scope.messages = [];
				socket.emit('get private messages', $scope.chat);
				$scope.chat.isPrivate = true;
				$cookieStore.put('isPrivate', true);
				prevMessages = 10000000;
				unseen = 0;
			}
			
			//Initiate public chat.
			$scope.setPublic = function(){
				$scope.recipients = 'All';
				$cookieStore.put('recipients', 'All');
				$scope.chat.receiver = '';
				$cookieStore.put('receiver', '');
				$scope.messages = [];
				socket.emit('get messages', $scope.chat);
				$scope.chat.isPrivate = false;
				$cookieStore.put('isPrivate', false);
				prevMessages = 10000000;
				unseen = 0;
			}
			
			//Send message to server and go through message population.
			$scope.send = function(){
				if ($scope.chat.message != ""){
					var time = new Date();
					time = moment.utc(time);
					$scope.chat.time = time.format("MM/DD/YYYY HH:mm");
					if ($scope.chat.isPrivate){
						socket.emit('send private message', $scope.chat);
					} else {
						socket.emit('send message', $scope.chat);
					}
					$scope.chat.message = "";
					unseen = -1;
				}
			};
			
			//Log out current user.
			$scope.logout = function(){
				var time = new Date();
				time = moment.utc(time);
				$scope.chat.time = time.format("MM/DD/YYYY HH:mm");
				$scope.chat.message = $scope.chat.username + " has logged out...";
				socket.emit('send message', $scope.chat);
				if ($scope.users.indexOf($scope.chat.receiver) != -1) socket.emit('send private message', $scope.chat);
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
			
			function findUser(user){
				for (var i = 0; i < $scope.users.length; i++){
					if ($scope.users[i].username == user){
						return i;
					}
				}
				return -1;
			}
				
        });
})();