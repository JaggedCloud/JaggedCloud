(function(){

  angular
    .module('hackbox')
    .controller('roomCtrl', RoomCtrl);

  RoomCtrl.$inject = ['$scope', 'Auth'];

  function RoomCtrl($scope, Auth){
    $scope.init = function(){
      var comm = new Icecomm('glkfL9sBKg/o6i2Ma3OS3kMqqbeEDT1ofUODOQjAlmwESS7LBu');

      comm.connect('hackbox', {audio: false});

      comm.on('connected', function(peer) {
        peerVideo.src = peer.stream;
      });

      comm.on('local', function(peer) {
        localVideo.src = peer.stream;
      });

      comm.on('disconnect', function(peer) {
        comm.leave();
      });
    };

    $scope.init();
  }
})();
