var expect = chai.expect;
/*
Unit test suite for the page the user first lands on (Home)
*/

//////////////////// Controllers ////////////////////
describe('homeCtrl', function() {
  beforeEach(module('hackbox'));

  var $controller;

  beforeEach(inject(function(_$controller_){
    // The injector unwraps the underscores (_) from around the parameter names when matching
    $controller = _$controller_;
  }));

  describe('', function() {
    it('should have all the necessary methods', function() {
      var $scope = {};
      var controller = $controller('homeCtrl', { $scope: $scope});
      console.log($scope);
      expect($scope.logout).to.not.be.undefined;
    });
  });
});

//////////////////// Factory/Service ////////////////////

describe('Video/Icecomm Service', function() {
    beforeEach(module('hackbox'));

    var IcecommWrapper;

    beforeEach(inject(function(_IcecommWrapper_) {
        IcecommWrapper = _IcecommWrapper_;
    }));

    it('should have all the necessary methods', function(){
        expect(IcecommWrapper.getIcecommInstance).to.not.be.undefined;
    });
});

