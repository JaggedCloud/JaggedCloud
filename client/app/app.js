(function(){

  var app = angular.module('hackbox', ['ui.router', 'ui.bootstrap']);

  app.config(function($stateProvider, $urlRouterProvider, $httpProvider) {
      $urlRouterProvider.otherwise('/');

      var authenticated = ['$q', 'Auth', function ($q, Auth) {
              var deferred = $q.defer();
              Auth.isAuthenticated()
                .then(function (response) {
                  if (response.data) {
                    deferred.resolve();
                  } else {
                    deferred.reject('Not logged in');
                  }
                });
              return deferred.promise;
            }];

      // Register all states for the application
      $stateProvider
        .state('home', {
            url: '/',
            controller: 'homeCtrl',
            templateUrl: 'app/home/home.html',
        })
        .state('room', {
            url: '/room/:roomId',
            controller: 'roomCtrl',
            templateUrl: 'app/room/room.html',
            resolve: {
              authenticated: authenticated
            }
        })
        .state('demo', {
            url: '/demo/:roomId',
            controller: 'roomCtrl',
            templateUrl: 'app/room/room.html'
        });
        // Attach token to all requests
        // $httpProvider.interceptors.push('AttachTokens');
  })
  
  .run(function ($rootScope, $state, $log) {
    $rootScope.$on('$stateChangeError', function () {
      // Redirect user to our home page
      $state.go('home', {reload: true});
    });
  });
  console.log('App loaded successfully');
})();
