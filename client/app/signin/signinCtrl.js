(function(){

  angular
    .module('hackbox')
    .controller('signinCtrl', SigninCtrl);

  SigninCtrl.$inject = ['$scope', '$modal', '$log'];

  function SigninCtrl($scope, $modal, $log){
    
    $scope.openModal = function () {
      var modalInstance = $modal.open({
        templateUrl: '/app/signin/signinModal.html',
        controller: 'signinModalCtrl',
        resolve: {
          items: function () {
            return $scope.items;
          }
        }
      });
    };
  }
})();