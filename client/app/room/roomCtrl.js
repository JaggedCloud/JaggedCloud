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

  RoomCtrl.$inject = ['$rootScope', '$timeout', '$scope', '$stateParams', 'TextEditor', 'Room', 'Drawing', '$state'];

  function RoomCtrl($rootScope, $timeout, $scope, $stateParams, TextEditor, Room, Drawing, $state){
    $scope.showCanvas = false;
    $scope.saving = false;
    $scope.roomId = $stateParams.roomId;
    $scope.saveInterval = null;
    $scope.isPeerTyping = false;
    $scope.videoToggle = false;
    $scope.open = false;
    $scope.close = false;
    $scope.creator = false;
    $scope.startTime;
    $scope.endTime;

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
      console.log($scope.roomId);
      Room.getRoom($scope.roomId, function(response){
         console.log(response.data);
        // Initialize text editors 
        // Assign the save keyboard shortcut to each editor
        TextEditor.init(response.data.text);
        TextEditor.assignKBShortcuts($scope.saveData);

        // Update the canvas with the saved data
        if(response.data.canvas){
          Drawing.updateCanvas(response.data.canvas);
        }

        // assign the creator
        $scope.creator = response.data.creator || false;

        // render the start and end times
        $scope.open = response.data.start_time > new Date() && response.data.start_time < response.data.end_time;
        $scope.close = response.data.end_time > new Date() && new Date() > response.data.start_time;
        $scope.startTime = new Date(response.data.start_time).toLocaleString();
        $scope.endTime = new Date(response.data.end_time).toLocaleString();

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
    $scope.saveData = function(startTime, endTime) {
      console.log('Saving canvas and text editor data...');
      $scope.saving = true;

      // Get canvas data and text editor data
      var canvasData = JSON.stringify(Drawing.getCanvas().toJSON());
      var textEditorData = [];
      TextEditor.getEditors().forEach(function(editor){
        textEditorData.push(editor.editor.getSession().getValue());
      });

      var startTime = Date.parse($scope.startTime);
      var endTime = Date.parse($scope.endTime);

      if(new Date() > endTime) {
        $scope.open = false;
      }

      console.log('start time', startTime, 'end time', endTime);

      Room.saveRoom($scope.roomId, canvasData, textEditorData, startTime, endTime, function(){
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

    $scope.openRoom = function(){
      $scope.startTime = new Date().toLocaleString();
      $scope.saveData();

      // state.go($state.current...) is kind of an ugly solution.. TODO: refactor to something less jarring
      $state.go($state.current, {}, {reload: true});
    };

    $scope.closeRoom= function(){
      $scope.endTime = (new Date() + 60000).toLocaleString();
      $scope.saveData();
      $state.go($state.current, {}, {reload: true});
    };
    //////////////////   End Room Methods   //////////////////

    // Call the initialize function
    console.log('Joining Interview with ID: ' + $stateParams.roomId);
    $scope.init();
  }
})();
