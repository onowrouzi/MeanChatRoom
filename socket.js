const q = require("q");

module.exports = function(io, mongo) {
  mongo.connect(
    "mongodb://heroku_80bclfr8:6vr8eh5phpqp4kjh83chn47raq@ds139645.mlab.com:39645/heroku_80bclfr8",
    function(err, db) {
      if (err) {
        throw err;
      }

      var currentUsers = [];
      var connections = [];

      io.on("connection", function(socket) {
        var messages = db.collection("messages");
        var privateMessages = db.collection("privateMessages");
        connections.push(socket);

        socket.on("check users", function(data) {
          socket.emit("get users", currentUsers);
        });

        socket.on("enter user", function(data) {
          if (currentUsers.indexOf(data) == -1) {
            currentUsers.push(data);
          }
          io.emit("add user", data);
        });

        socket.on("get messages", function(data) {
          getMessages().then(function(messages) {
            socket.emit("receive messages", messages);
          });
        });

        socket.on("get private messages", function(data) {
          getPrivateMessages(data).then(function(messages) {
            socket.emit("receive private messages", messages);
          });
        });

        socket.on("send message", function(data) {
          messages.insert(
            {
              username: data.username,
              message: data.message,
              time: data.time,
              avatar: data.avatar,
              isPrivate: data.isPrivate
            },
            function() {
              io.emit("new message", data);
            }
          );
        });

        socket.on("send private message", function(data) {
          privateMessages.insert(
            {
              username: data.username,
              receiver: data.receiver,
              message: data.message,
              time: data.time,
              avatar: data.avatar,
              isPrivate: data.isPrivate
            },
            function() {
              socket.emit("new message", data);
              connections[currentUsers.indexOf(data.receiver)].emit(
                "new message",
                data
              );
              connections[currentUsers.indexOf(data.receiver)].emit(
                "private notification",
                data.username
              );
            }
          );
        });

        socket.on("log out", function(data) {
          currentUsers.splice(currentUsers.indexOf(data.user), 1);
          io.emit("remove user", data.user);
        });

        socket.on("disconnect", function(data) {
          connections.splice(connections.indexOf(socket), 1);
        });

        function getMessages() {
          var deferred = q.defer();
          messages.find().toArray(function(err, item) {
            if (err) {
              deferred.reject(err);
            } else {
              deferred.resolve(item);
            }
          });
          return deferred.promise;
        }

        function getPrivateMessages(data) {
          var deferred = q.defer();
          privateMessages
            .find({
              $or: [
                {
                  username: data.username,
                  receiver: data.receiver
                },
                {
                  username: data.receiver,
                  receiver: data.username
                }
              ]
            })
            .toArray(function(err, item) {
              if (err) deferred.reject(err);
              else deferred.resolve(item);
            });
          return deferred.promise;
        }
      });
    }
  );
};
