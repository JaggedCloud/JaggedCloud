/** 
 * drawingCtrl.js
 * 
 * This is the controller responsible for the drawing canvas in a room.
 */

(function() {
  angular
    .module('hackbox')
    .controller('drawingCtrl', DrawingCtrl);

  DrawingCtrl.$inject = ['$scope', 'Drawing', 'Sockets'];

  function DrawingCtrl($scope, Drawing, Sockets) {
    $scope.drawingCanvas = null;
    $scope.isPeerDrawing = false;
    
    //The $destroy event is called when we leave this view
    $scope.$on('destroy', function() {
      $scope.uninit();
    });

    /**
     * 
     * Function: DrawingCtrl.init()
     * This function initializes all entities upon switching room state
    */
    $scope.init = function() {
      $scope.addCanvas();
      $scope.initializeIO();
    };

    /**
     * Function: DrawingCtrl.uninit()
     * This function will be called when we leave a room
     * It will destroy all editors currently in use
    */
    $scope.uninit = function() {
      console.log('Destroying Canvas');
      Drawing.removeCanvas();
    };

    $scope.initializeIO = function() {
      Drawing.initializeIO($scope.isPeerDrawing);
      Sockets.on('toggleDrawingMessage', function() {
        $scope.isPeerDrawing = !$scope.isPeerDrawing;
        $scope.$digest();
        console.log($scope.isPeerDrawing);
      });
    };

    $scope.stopIOListeners = function() {
      Drawing.stopIO();
    };

    /**
     * Function: DrawingCtrl.addCanvas()
     * This function adds a new Fabric Canvas to the DOM
    */
    $scope.addCanvas = function() {
      $scope.drawingCanvas = Drawing.makeCanvas();
    };

    $scope.toggleErasing = function() {
      Drawing.toggleErasing();
    };

    $scope.toggleDrawingMode = function() {
      $scope.drawingCanvas.isDrawingMode = !$scope.drawingCanvas.isDrawingMode;
    };
    $scope.init();
  }
})();