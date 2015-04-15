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
    $scope.saveInterval = null;
    var AUTOSAVE_FREQUENCY_MS = 60000;

    // The $destroy event is called when we leave this view
    $scope.$on('$destroy', function(){
      $scope.uninit();
      clearInterval($scope.saveInterval);
    });

    /**  
     * Function: RoomCtrl.init()
     * This function will initialize all entities upon switching the the room state.
     */
    $scope.init = function(){
      console.log('Initializing room controller');

      // Fetch the room from the database
      Room.getRoom($scope.roomID, function(response){

        // If there is text saved, set the editors text to that. 
        if(response.data.text.length > 0){
          response.data.text.forEach(function(savedText, i){
            TextEditor.addTextEditor($scope.saveData);
            TextEditor.setEditorText(savedText, i);
          });
          TextEditor.setActiveEditor(0);
        } 
        else{
          TextEditor.addTextEditor($scope.saveData);
        }

        // Initialize the listener for incoming text
        TextEditor.initializeDataListener();

        // Assign the save keyboard shortcut to each editor
        assignKBShortcuts();

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
     * Function: RoomCtrl.addEditor()
     * This function is called when the user clicks the '+' button to add a new text editor.
     */
    $scope.addEditor = function(){
      TextEditor.addTextEditor();
      assignKBShortcuts();
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
      var drawingData = JSON.stringify(Drawing.getCanvas().toJSON());
      var textEditorData = [];
      TextEditor.getEditors().forEach(function(editor){
        textEditorData.push(editor.editor.getSession().getValue());
      });

      // Build AJAX request and send
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

    /////////////// Helper Functions ///////////////
    /**
     * Function: assignKBShortcuts()
     * This function will assign the KB shortcut for saving to the editor. 
     */
    function assignKBShortcuts(){
      // Assign the save keyboard shortcut to each editor
      TextEditor.getEditors().forEach(function(editor){
          editor.editor.commands.addCommand({  name: 'saveFile',
                                        bindKey: {
                                        win: 'Ctrl-S',
                                        mac: 'Command-S',
                                        sender: 'editor|cli'
                                     },
                                      exec: $scope.saveData
          });
      });
    }
    /////////////// End Helper Functions ///////////////

    // Call the initialize function
    console.log('Joining Interview with ID: ' + $stateParams.roomId);
    $scope.init();
  }
})();