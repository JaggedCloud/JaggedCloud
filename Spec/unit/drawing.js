var expect = chai.expect;

/*
Unit test suite for drawing controller in room view
*/

describe('drawingCtrl', function() {
  beforeEach(module('hackbox'));

  var $controller;
  var $rootScope;

  beforeEach(inject(function(_$controller_, _$rootScope_) {
    //The injector unwraps the underscores (_) from around the parameter names when matching
    $controller = _$controller_;
    $rootScope = _$rootScope_;
  }));

  describe('', function() {
    it('should have all the necessary methods and properties', function() {
      var $scope = {};
      var controller = $controller('drawingCtrl', {$scope: $rootScope});

      console.log('drawing controller scope:', $rootScope);

      //Methods
      expect($rootScope.init).to.not.be.undefined;
      expect($rootScope.uninit).to.not.be.undefined;
      expect($rootScope.initializeIO).to.not.be.undefined;
      expect($rootScope.addCanvas).to.not.be.undefined;
      expect($rootScope.toggleDrawingMode).to.not.be.undefined;

      // Properties
      expect($rootScope.drawingCanvas).to.not.be.undefined;
    });
  });
});