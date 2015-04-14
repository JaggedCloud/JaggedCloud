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

  RoomCtrl.$inject = ['$scope', '$http', '$stateParams', 'TextEditor', 'Room', 'Drawing'];

  function RoomCtrl($scope, $http, $stateParams, TextEditor, Room, Drawing){
    $scope.showCanvas = false;
    $scope.saving = false;
    $scope.roomID = $stateParams.roomId;
    $scope.saving = false;



    /**  
     * Function: RoomCtrl.init()
     * This function will initialize all entities upon switching the the room state.
     */
    $scope.init = function(){
      console.log('Initializing room controller');
      Room.getRoom($scope.roomID, function(response){
        // Add an editor to the room
        TextEditor.addTextEditor();
        TextEditor.initializeDataListener();

        // If there is text saved, set the editors text to that. 
        if(response.data.text){
          TextEditor.setEditorText(response.data.text[0], 0);
        }

        // Update the canvas with the saved data
        if(response.data.canvas){
          Drawing.updateCanvas(response.data.canvas);
        }
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

    // The $destroy event is called when we leave this view
    $scope.$on('$destroy', function(){
      $scope.uninit();
    });

    /**
     * Function: RoomCtrl.saveData()
     * This function is called when the user clicks the saveCanvas button
     * It converts the canvas data into a png image string and then
     * makes a request to our server to store the image in the database
     */
    $scope.saveData = function() {
      console.log('Saving canvas and text editor data...');
      $scope.saving = true;

      var drawingData = JSON.stringify(Drawing.getCanvas().toJSON());

      var textEditorData = TextEditor.getEditors()[0].editor.getSession().getValue();

      var request = {
        method: 'POST',
        url: '/room/save',
        data: { 
          roomId: $scope.roomID,
          canvas: drawingData,
          textEditor: textEditorData
        }
      };

      $http(request).success(function(response){
        console.log('http response', response);
      })
      .error(function(error){
        console.log('error', error);
      })
      .then(function(){
        $scope.saving = false;
      });
    };
    /**
     * Function: RoomCtrl.toggleCanvas()
     * This function will toggle the canvas on/off.
     */
    $scope.toggleCanvas = function(){
      $scope.showCanvas = !$scope.showCanvas;
      if(!$scope.showCanvas){
        TextEditor.resizeAllEditors();
      }
    };

    // Call the initialize function
    console.log('Joining Interview with ID: ' + $stateParams.roomId);
    $scope.init();
  }
})();