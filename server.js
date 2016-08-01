var express = require('express');
var app = express();
var mongo = require('mongodb').MongoClient;
var server = require('http').createServer(app);
var io = require('socket.io').listen(server).sockets;
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var validator = require('express-validator');
var session = require('express-session');
var passport = require('passport');
var localStrategy = require('passport-local').Strategy;
var users = require('./routes/users');
var socket = require('./socket');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(session({
	secret: 'secret',
	saveUninitialized: true,
	resave: true
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(validator({
  errorFormatter: function(param, msg, value) {
      var namespace = param.split('.')
      , root    = namespace.shift()
      , formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  }
}));

app.use('/users', users);

server.listen(process.env.PORT || 3000);
console.log("Server started on port 3000");

app.get('/', function(req, res){
	res.sendFile(__dirname + '/public/html/index.html');
});

app.use(express.static('public'));

socket(io, mongo);