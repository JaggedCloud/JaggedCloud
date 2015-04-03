(function(){

  angular
    .module('hackbox')
    .controller('homeCtrl', HomeCtrl);

  HomeCtrl.$inject = ['$scope' ,'$modal', '$log', 'Auth'];

  function HomeCtrl($scope, $modal, $log, Auth){

    // Function: HomeCtrl.logout()
    // This function will log the user out.
    $scope.logout = function () {
        Auth.logout();
        console.log('Logging out!');
    };
  }
})();
