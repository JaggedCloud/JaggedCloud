(function(){

  angular
    .module('hackbox')
    .factory('Room', Room);

  Room.$inject = ['$http'];

  function Room($http){

    var instance = {
      createRoom: createRoom,
      getRoom: getRoom,
      saveRoom: saveRoom,
      getUpcomingInterviews: getUpcomingInterviews,
      deleteRoom: deleteRoom,
      exists: exists,
      access: access
    };

    return instance;

    ///// IMPLEMENTATION /////
    function createRoom(room, callback){
      console.log('Creating room!',room);
      return $http({
        method: 'POST',
        url: '/room/create',
        data: room
      }).then(function(response){
        callback(response);
      });
    }

    function saveRoom(roomId, canvasData, textEditorData, startTime, endTime, callback){
      console.log('Saving canvas and text editor data...');
      return $http({
        method: 'POST',
        url: '/room/save',
        data: { 
          roomId: roomId,
          canvas: canvasData,
          textEditor: textEditorData,
          startTime: startTime,
          endTime: endTime
        }
      })
      .error(function(error){
        console.log('error', error);
        callback();
      })
      .then(function(response){
        console.log('http response', response);
        callback();
      });
    }
    
    function getRoom(roomId, callback){
      console.log('Getting room data for room: ', roomId);

      return $http({
        method: 'GET',
        url: '/room/get' + roomId
      }).then(function(response){
        callback(response);
      });        
    }

    function getUpcomingInterviews(callback){
      console.log('Getting snapshot of all incomplete interviews for current user');
      return $http({
        method: 'GET',
        url: '/room/home'
      }).then(function(response){
        callback(response);
      });        
    }

    function deleteRoom(roomId, callback){
      console.log('Deleting Room: ', roomId);

      return $http({
        method: 'DELETE',
        url: '/room/remove' + roomId
      }).then(function(response){
        callback(response);
      });        
    }

    function exists(roomId, callback){
      console.log('Determining if ', roomId, ' exists');
      return $http({
        method: 'GET',
        url: '/room/exists' + roomId
      }).then(function(response){
        callback(response);
      });
    }

    function access(roomId, callback){
      console.log('Determining access to room', roomId);
      return $http({
        method: 'GET',
        url: '/room/access' + roomId
      }).then(function(response){
        callback(response);
      });
    }
  }
})();