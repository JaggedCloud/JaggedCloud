(function(){

  var app = angular.module('interview', ['ui.router']);

  app.config(function($stateProvider, $urlRouterProvider, $httpProvider) {
      $urlRouterProvider.otherwise('/');
      $stateProvider
        .state('home', {
            url: '/',
            controller: 'HomeCtrl',
            templateUrl: 'app/home/home.html',
        })
        .state('room', {
            url: '/room',
            controller: 'RoomCtrl',
            templateUrl: 'app/room/room.html'
        });
  });
  console.log('App loaded successfully');
})();
