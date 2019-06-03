(function() {
  "use strict";

  angular
    .module("app")
    .controller("chat_controller", function chat_controller(
      $scope,
      $rootScope,
      socket,
      Idle,
      $window,
      $cookieStore
    ) {
      var self = this;

      self.getUsers = getUsers;
      self.getMessages = getMessages;
      self.getEnter = getEnter;
      self.setPrivate = setPrivate;
      self.setPublic = setPublic;
      self.send = send;
      self.logout = logout;

      init();

      function init() {
        Idle.watch();
        self.isCollapsed = $window.innerWidth < 768;
        self.recipients = $cookieStore.get("recipients");
        self.unseen = 0;
        self.prevMessages = 10000000; //Number of messages to compare with the number of received messages.

        $rootScope.title = "MEANchat";
        self.messages = [];
        self.chat = {
          username: $cookieStore.get("username"),
          avatar: $cookieStore.get("avatar"),
          isPrivate: $cookieStore.get("isPrivate"),
          receiver: $cookieStore.get("receiver")
        };

        getUsers();
        getMessages();
      }

      function getUsers() {
        if ($cookieStore.get("users") == "") {
          self.users = [];
          socket.emit("check users", self.chat);
        } else {
          self.users = $cookieStore.get("users");
        }
      }

      function getMessages() {
        if (self.chat.isPrivate) {
          socket.emit("get private messages", self.chat);
        } else {
          socket.emit("get messages", self.chat);
        }
      }

      function send() {
        if (self.chat.message && self.chat.message.trim() != "") {
          var time = new Date();
          time = moment.utc(time);
          self.chat.time = time.format("MM/DD/YYYY HH:mm");

          if (self.chat.isPrivate) {
            socket.emit("send private message", self.chat);
          } else {
            socket.emit("send message", self.chat);
          }
          self.chat.message = "";
          self.unseen = -1;
        }
      }

      function getEnter(e) {
        if (e.which === 13) {
          self.send();
        }
      }

      function logout() {
        $cookieStore.put("auth", false);
        socket.emit("log out", { user: self.chat.username });
        socket.emit("disconnect");
        $window.location.reload();
      }

      function setPrivate(user) {
        user.request = false;
        $cookieStore.put("users", self.users);
        self.recipients = user.username;
        $cookieStore.put("recipients", user.username);
        self.chat.receiver = user.username;
        $cookieStore.put("receiver", user.username);
        self.messages = [];
        socket.emit("get private messages", self.chat);
        self.chat.isPrivate = true;
        $cookieStore.put("isPrivate", true);
        self.prevMessages = 10000000;
        self.unseen = 0;
      }

      function setPublic() {
        self.recipients = "All";
        $cookieStore.put("recipients", "All");
        self.chat.receiver = "";
        $cookieStore.put("receiver", "");
        self.messages = [];
        socket.emit("get messages", self.chat);
        self.chat.isPrivate = false;
        $cookieStore.put("isPrivate", false);
        self.prevMessages = 10000000;
        self.unseen = 0;
      }

      socket.emit("enter user", self.chat.username);

      socket.on("get users", function(data) {
        $scope.$apply(function() {
          self.users = _.map(data, function(d) {
            return {
              username: d,
              request: false
            };
          });
          $cookieStore.put("users", self.users);
        });
      });

      socket.on("add user", function(data) {
        if (_.some(self.users, { username: data })) {
          $scope.$apply(function() {
            self.users.push({ username: data, request: false });
            $cookieStore.put("users", self.users);
          });
        }
      });

      socket.on("remove user", function(data) {
        $scope.$apply(function() {
          self.users = _.reject(self.users, { username: data });
          if (data == self.chat.receiver) {
            alert(self.chat.receiver + " has logged out...");
            self.setPublic();
          }
        });
      });

      socket.on("receive messages", function(data) {
        if (!self.chat.isPrivate) {
          $scope.$apply(function() {
            self.messages = _.map(data, function(m) {
              m.timeMs = Date.parse(m.time);
              return m;
            });
          });
        }
      });

      socket.on("receive private messages", function(data) {
        if (self.chat.isPrivate) {
          $scope.$apply(function() {
            self.messages = _.map(data, function(m) {
              m.timeMs = Date.parse(m.time);
              return m;
            });
          });
        }
      });

      socket.on("new message", function(data) {
        if (
          data.isPrivate == self.chat.isPrivate &&
          (!data.isPrivate ||
            (data.username == self.chat.username &&
              data.receiver == self.chat.receiver) ||
            (data.receiver == self.chat.username &&
              data.username == self.chat.receiver))
        ) {
          $scope.$apply(function() {
            data.timeMs = Date.parse(data.time);
            self.messages.push(data);
            self.unseen++;
            if (self.unseen > 0) {
              $rootScope.title = "MEANchat (" + self.unseen + ")";
            }
          });
        }
      });

      socket.on("private notification", function(data) {
        $scope.$apply(function() {
          var user = _.find(self.users, { username: data });
          if (user) {
            user.request = true;
          }
          $cookieStore.put("users", self.users);
          $scope.$apply();
        });
      });

      $window.onfocus = function() {
        $scope.$apply(function() {
          self.unseen = 0;
          $rootScope.title = "MEANchat";
        });
      };

      angular.element($window).bind("resize", function() {
        $scope.$apply(function() {
          self.isCollapsed = $window.innerWidth < 768;
        });
      });

      $scope.$on("IdleTimeout", function() {
        alert("You have been idle too long. You will now be logged out.");
        self.logout();
      });
    });
})();
