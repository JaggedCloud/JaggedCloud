(function(){

  var app = angular.module('hackbox', ['ui.router', 'ui.bootstrap']);

  app.config(function($stateProvider, $urlRouterProvider, $httpProvider) {
      $urlRouterProvider.otherwise('/');

      // Register all states for the application
      $stateProvider
        .state('home', {
            url: '/',
            controller: 'homeCtrl',
            templateUrl: 'app/home/home.html',
        })
        .state('room', {
            url: '/room',
            controller: 'roomCtrl',
            templateUrl: 'app/room/room.html',
            authenticate: true
        })

        // Attach token to all requests
        $httpProvider.interceptors.push('AttachTokens');
  })
  
  // Anytime a state changes, this function ensures that any route that needs 
  // authentication is authenticated.
  .run(function ($rootScope, $state, $stateParams, Auth) {
    $rootScope.$on('$stateChangeStart', function(event, toState, toStateParams){
      if (toState && toState.authenticate && !Auth.isAuthenticated()) {
        $state.go('home');
        event.preventDefault();
      }
    });
  });

  console.log('App loaded successfully');
})();
