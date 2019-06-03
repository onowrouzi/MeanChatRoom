(function() {
  "use strict";

  angular
    .module("app")
    .controller("login_controller", function login_controller(
      $state,
      $http,
      $cookieStore
    ) {
      var self = this;
      self.login = login;

      function login() {
        $http
          .post("/users/login", self.user)
          .success(function(data, status) {
            $cookieStore.put("auth", true);
            $cookieStore.put("username", data.username);
            $cookieStore.put("isPrivate", false);
            $cookieStore.put("recipients", "All");
            $cookieStore.put("receiver", "");
            $cookieStore.put("users", "");
            if (data.avatar) {
              $cookieStore.put("avatar", data.avatar);
            } else {
              $cookieStore.put(
                "avatar",
                "https://upload.wikimedia.org/wikipedia/commons/7/70/User_icon_BLACK-01.png"
              );
            }
            $state.go("chat");
          })
          .error(function(data, status, headers, config, statusTxt) {
            self.error = true;
          });
      }
    });
})();
