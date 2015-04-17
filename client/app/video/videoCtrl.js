/** 
 * videoCtrl.js
 * 
 * This is the controller responsible for the video/audio stream
 */

(function(){

  angular
    .module('hackbox')
    .controller('videoCtrl', VideoCtrl);

  VideoCtrl.$inject = ['$scope' ,'$sce', '$stateParams', 'IcecommWrapper'];

  function VideoCtrl($scope, $sce, $stateParams, IcecommWrapper){
    $scope.userVideoSource = null;
    $scope.peerVideoSource = null;
    $scope.userVideoConnected = false;
    $scope.peerVideoConnected = false;

    // The $destroy event is called when we leave this view
    $scope.$on('$destroy', function(){
      $scope.uninit();
    });

    /**
     * Function: VideoCtrl.init(roomName)
     * This function will initialize the Video component of the room.
     *
     * @param roomName: A string representing the roomname to join. 
     */
    $scope.init = function(roomName){
      // Create the Icecomm object and get the instance of it.
      var comm = IcecommWrapper.getIcecommInstance();

      // Connect to the correct room. Room supports a maximum of 2 people. 
      comm.connect(roomName, {limit: 2, audio: true});

      // Register user video connected event
      comm.on('local', function(peer) {
        $scope.$apply(function(){
          $scope.userVideoSource = $sce.trustAsResourceUrl(peer.stream);
          $scope.userVideoConnected = true;
        });
      });

      // Register peer connect/disconnect event
      comm.on('connected', function(peer) {
        $scope.$apply(function(){
          $scope.peerVideoSource = $sce.trustAsResourceUrl(peer.stream);
          $scope.peerVideoConnected = true;
        });
      });

      comm.on('disconnect', function(peer) {
        $scope.$apply(function(){
          $scope.peerVideoSource = '';
          $scope.peerVideoConnected = false;
        });
      });
    };

    /**
     * Function: VideoCtrl.uninit()
     * This function will be called when we leave a room.
     * It will shut down the video and audio stream.
     */
    $scope.uninit = function(){
      console.log('Shutting down video and removing listeners.');
      IcecommWrapper.getIcecommInstance().leave(true);
    };
    
    $scope.init($stateParams.roomId);
  }

})();
