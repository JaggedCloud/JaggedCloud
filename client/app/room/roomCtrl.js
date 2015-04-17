/** 
 * roomCtrl.js
 * 
 * This is the controller responsible for the room view. 
 * Anything needing to change the room view should be placed here. 
 */

(function(){

  angular
    .module('hackbox')
    .controller('roomCtrl', RoomCtrl);

  RoomCtrl.$inject = ['$rootScope', '$timeout', '$scope', '$stateParams', 'TextEditor', 'Room', 'Drawing'];

  function RoomCtrl($rootScope, $timeout, $scope, $stateParams, TextEditor, Room, Drawing){
    $scope.showCanvas = false;
    $scope.saving = false;
    $scope.roomId = $stateParams.roomId;
    $scope.saveInterval = null;
    $scope.isPeerTyping = false;
    $scope.videoToggle = false;

    var isTypingPromise = null;
    var AUTOSAVE_FREQUENCY_MS = 60000;

    ////////////////// Event Listeners //////////////////
    /**
     * The $destroy event is called when we leave this view
     */
    $scope.$on('$destroy', function(){
      $scope.uninit();
      clearInterval($scope.saveInterval);
    });

    /**
     * This event is heard when Icecomm is receiving data. 
     * It starts a 1 second timer to display a message which will reset if
     * data is continued to be heard before the timer expires. 
     * When the timer expires, the message is removed. 
     */
    $rootScope.$on('receivingData', function(){
      $scope.$apply(function(){
        $scope.isPeerTyping = true;

        if(isTypingPromise !== null )
          $timeout.cancel(isTypingPromise);

        isTypingPromise = $timeout(function () { $scope.isPeerTyping = false; }, 1000);
      });
    });
    ////////////////// End Event Listeners //////////////////

    //////////////////    Room Methods     //////////////////
    /**  
     * Function: RoomCtrl.init()
     * This function will initialize all entities upon switching the the room state.
     */
    $scope.init = function(){
      console.log('Initializing room controller');

      // Fetch the room from the database
      Room.getRoom($scope.roomId, function(response){

        // Initialize text editors 
        // Assign the save keyboard shortcut to each editor
        TextEditor.init(response.data.text);
        TextEditor.assignKBShortcuts($scope.saveData);

        // Update the canvas with the saved data
        if(response.data.canvas){
          Drawing.updateCanvas(response.data.canvas);
        }

        // Start interval for saving
        $scope.saveInterval = setInterval(function(){
          $scope.saveData();
        }, AUTOSAVE_FREQUENCY_MS);
      });
    };

    /**
     * Function: RoomCtrl.uninit()
     * This function will be called when we leave a room.
     * It will cleanup all entities within a given room such as video and text editors. 
     */
    $scope.uninit = function(){
      console.log('Leaving Room!');
    };

    /**
     * Function: RoomCtrl.saveData()
     * This function is called when the user clicks the saveCanvas button
     * It converts the canvas data into a png image string and then
     * makes a request to our server to store the image in the database
     */
    $scope.saveData = function() {
      console.log('Saving canvas and text editor data...');
      $scope.saving = true;

      // Get canvas data and text editor data
      var canvasData = JSON.stringify(Drawing.getCanvas().toJSON());
      var textEditorData = [];
      TextEditor.getEditors().forEach(function(editor){
        textEditorData.push(editor.editor.getSession().getValue());
      });

      Room.saveRoom($scope.roomId, canvasData, textEditorData, function(){
        $scope.saving = false;
      });
    };

    /**
     * Function: RoomCtrl.toggleCanvas()
     * This function will toggle the canvas on/off.
     */
    $scope.toggleCanvas = function(forceCanvasOff){
      if(forceCanvasOff !== undefined && forceCanvasOff)
        $scope.showCanvas = false;
      else if(forceCanvasOff !== undefined && !forceCanvasOff)
        $scope.showCanvas = true;
      else
        $scope.showCanvas = !$scope.showCanvas;

      if(!$scope.showCanvas){
        TextEditor.resizeAllEditors();
      }
    };
    
    $scope.clearCanvas = function() {
      Drawing.clearCanvas();
    };
    $scope.toggleEraser = function() {
      Drawing.toggleEraser();
    };

    /**
     * Function: RoomCtrl.toggleVideo()
     * This function will toggle the video between the user and peer.
     */
    $scope.toggleVideo = function(){
      $scope.videoToggle = !$scope.videoToggle;
    };
    //////////////////   End Room Methods   //////////////////

    // Call the initialize function
    console.log('Joining Interview with ID: ' + $stateParams.roomId);
    $scope.init();
  }
})();
