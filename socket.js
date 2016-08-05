module.exports = function(io, mongo) {
	
	mongo.connect('mongodb://127.0.0.1/chat', function(err, db){
		
		if(err) throw err;
		
		var currentUsers = [];
		var connections = [];
		
		io.on('connection', function(socket){
			var messages = db.collection('messages');
			var privateMessages = db.collection('privateMessages');
			connections.push(socket);
			console.log('Connected: ' + connections.length + ' sockets connected');
			
			socket.on('check users', function(data){
				socket.emit('get users', currentUsers);
			});
			
			socket.on('enter user', function(data){
				if (currentUsers.indexOf(data) == -1) {
					currentUsers.push(data);
					console.log("ENTER USER: " + data);
				}
				io.emit('add user', data);
			});
			
			socket.on('get messages', function(data){ 
				console.log("Getting messages for " + data.username);
				messages.find().each(function(err, msg){
					if (err) throw err;
					if (msg != null) {
						socket.emit('receive messages', msg);
					}
				});
			});
			
			socket.on('get private messages', function(data){
				console.log("Getting private messages for " + data.username);
				privateMessages.find({
					$or:[
						{
							'username': data.username,
							'receiver': data.receiver
						},
						{
							'username': data.receiver,
							'receiver': data.username
						}
					]
				}).each(function(err, msg){
					if (err) throw err;
					if (msg != null) {
						socket.emit('receive private messages', msg);
					}
				});
			});
			
			socket.on('send message', function(data){
				messages.insert({username: data.username, 
								message: data.message, 
								time: data.time, 
								avatar: data.avatar,
								isPrivate: data.isPrivate},
				function(){
					io.emit('new message', data);
					console.log("Inserted message: " + data.username + " -> " + data.message + " at " + data.time);
				});
			});
			
			socket.on('send private message', function(data){
				privateMessages.insert({username: data.username, 
										receiver: data.receiver, 
										message: data.message, 
										time: data.time, 
										avatar: data.avatar,
										isPrivate: data.isPrivate}, 
				function(){
					socket.emit('new message', data);
					connections[currentUsers.indexOf(data.receiver)].emit('new message', data);
					connections[currentUsers.indexOf(data.receiver)].emit('private notification', data.username);
					console.log("Inserted private message: " + data.username + " to " + data.receiver + " -> " 
								+ data.message + " at " + data.time);
				});
			});
			
			socket.on('log out', function(data){
				console.log(data.user + ' logged out.');
				currentUsers.splice(currentUsers.indexOf(data.user),1);
				io.emit('remove user', data.user);
			});	
			
			socket.on('disconnect', function(data){
				connections.splice(connections.indexOf(socket), 1);
				console.log('Disconnected: ' + connections.length + ' sockets connected');
			});

		});
		
	});
	
}