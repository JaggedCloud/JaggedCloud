var expect = chai.expect;
/*
Unit test suite for the page the interview room view (main page of app)
*/

//////////////////// Controllers ////////////////////
describe('roomCtrl', function() {
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
      var controller = $controller('roomCtrl', {$scope: $rootScope});
      
      console.log('room controller scope:', $rootScope);
      expect($rootScope.init).to.not.be.undefined;
      expect($rootScope.saveData).to.not.be.undefined;
      expect($rootScope.toggleCanvas).to.not.be.undefined;
      expect($rootScope.showCanvas).to.be.false;
    });

    it('toggleCanvas should flip the truth value of the showCanvas property', function() {
      var $scope = {};
      var controller = $controller('roomCtrl', {$scope: $rootScope});
      
      var origShowCanvasTest = $rootScope.showCanvas;
      $rootScope.toggleCanvas();
      expect(origShowCanvasTest).to.not.equal($rootScope.showCanvas);
    });
  });
});

//////////////////// Room Factory ////////////////////
describe('Room Factory', function() {
  beforeEach(module('hackbox'));

  var Room;

  beforeEach(inject(function(_Room_) { 
    Room = _Room_;
  }));

  it('should have all the necessary methods', function() {
     expect(Room.createRoom).to.not.be.undefined;
     expect(Room.saveRoom).to.not.be.undefined;
     expect(Room.getRoom).to.not.be.undefined;
  });
});
