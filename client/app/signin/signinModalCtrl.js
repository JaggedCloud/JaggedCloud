(function(){

  angular
    .module('hackbox')
    .controller('signinModalCtrl', SigninModalCtrl);

  SigninModalCtrl.$inject = ['$scope','$modalInstance'];

  function SigninModalCtrl($scope, $modalInstance){

    $scope.submit = function () {
      $modalInstance.close();
    };

    $scope.cancel = function () {
      $modalInstance.dismiss('cancel');
    };
  }
})();