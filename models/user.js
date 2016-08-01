var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

mongoose.connect('mongodb://onowrouzi:therighs1@ds139645.mlab.com:39645/heroku_80bclfr8',function(){
	console.log('Chat user database has been connected!')
});

var UserSchema = mongoose.Schema({
	username: {
		type: String,
		index: true
	},
	password: {
		type: String
	}
});

var User = module.exports = mongoose.model('User', UserSchema);

//Register User
module.exports.createUser = function(newUser, callback){
	bcrypt.genSalt(10, function(err, salt) {
	    bcrypt.hash(newUser.password, salt, function(err, hash) {
	        newUser.password = hash;
	        newUser.save(callback);
	    });
	});
}
//Find User by Username
module.exports.getUserByUsername = function(username, callback){
	var query = {username: username};
	User.findOne(query, callback);
}
//Find User by Id
module.exports.getUserById = function(id, callback){
	User.findById(id, callback);
}
//Compare user password with password given.
module.exports.comparePassword = function(candidate, hash, callback){
	bcrypt.compare(candidate, hash, function(err, isMatch){
		if(err) throw err;
		callback(null, isMatch);
	});
}