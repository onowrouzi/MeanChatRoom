(function() {
  "use strict";

  angular.module("app").config(function($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise("/chat");

    $stateProvider
      .state("login", {
        url: "/",
        templateUrl: "/html/login.html",
        controller: "login_controller as lc",
        resolve: {
          load: function($q, $timeout, $state, $cookieStore) {
            var deferred = $q.defer();
            $timeout(function() {
              if (!$cookieStore.get("auth")) {
                deferred.resolve();
              } else {
                $state.go("chat");
                deferred.reject();
              }
            });
            return deferred.promise;
          }
        }
      })
      .state("chat", {
        url: "/chat",
        templateUrl: "/html/chat.html",
        controller: "chat_controller as cc",
        resolve: {
          load: function($q, $timeout, $state, $cookieStore) {
            var deferred = $q.defer();
            $timeout(function() {
              if ($cookieStore.get("auth")) {
                deferred.resolve();
              } else {
                $state.go("login");
                deferred.reject();
              }
            });
            return deferred.promise;
          }
        }
      })
      .state("contact", {
        url: "/contact",
        templateUrl: "/html/contact.html"
      })
      .state("about", {
        url: "/about",
        templateUrl: "/html/about.html"
      })
      .state("register", {
        url: "/register",
        templateUrl: "/html/register.html",
        controller: "register_controller as rc"
      });
  });
})();
