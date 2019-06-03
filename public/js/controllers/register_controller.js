(function() {
  "use strict";

  angular
    .module("app")
    .controller("register_controller", function register_controller(
      $state,
      $http
    ) {
      var self = this;

      self.user = {};

      self.register = function() {
        $http
          .post("/users/register", self.user)
          .success(function(data, status) {
            $state.go("login");
          })
          .error(function(data, status, headers, config, statusTxt) {
            self.error = true;
          });
      };
    });
})();
