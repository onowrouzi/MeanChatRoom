(function () {
    'use strict';

    angular
        .module('app')
        .config(function ($stateProvider, $urlRouterProvider) {
          
            $urlRouterProvider.otherwise("/chat");
            
            $stateProvider
              .state('login', {
                  url: "/",
                  templateUrl: "/html/login.html",
                  controller: "login_controller",
				  resolve: {
					  load: function($q, $cookieStore){
						  var deferred = $q.defer();
						  if (!$cookieStore.get('auth')){
							  deferred.resolve();
						  } else {
							  deferred.reject();
						  }
						  return deferred.promise;
					  }
				  } 
              })
			  .state('chat', {
				  url: "/chat",
				  templateUrl: "/html/chat.html",
				  controller: "chat_controller",
				  resolve: {
					  load: function($q, $cookieStore){
						  var deferred = $q.defer();
						  if ($cookieStore.get('auth')){
							  deferred.resolve();
						  } else {
							  deferred.reject();
						  }
						  return deferred.promise;
					  }
				  }			
			  })
			  .state('contact', {
				  url: "/contact",
				  templateUrl: "/html/contact.html"
			  })
			  .state('about', {
				  url: "/about",
				  templateUrl: "/html/about.html"
			  })
			  .state('register', {
				  url: "/register",
				  templateUrl: "/html/register.html",
				  controller: "register_controller"
			  });
        });
})();
