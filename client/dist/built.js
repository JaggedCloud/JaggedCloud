(function(){

  var app = angular.module('hackbox', ['ui.router', 'ui.bootstrap']);

  app.config(function($stateProvider, $urlRouterProvider, $httpProvider) {
      $urlRouterProvider.otherwise('/');

      var authenticated = ['$q', '$state','Auth', function ($q, $state, Auth) {
              var deferred = $q.defer();
              Auth.isAuthenticated()
                .then(function (response) {
                  if (response.data) {
                    deferred.resolve();
                  } else {
                    deferred.reject('Not logged in');
                    $state.go('landingPage');
                  }
                });
              return deferred.promise;
            }];

      var access = ['$state', '$stateParams', '$q', 'Room', function($state, $stateParams, $q, Room){
        var deferred = $q.defer();
        Room.access($stateParams.roomId, function(response) {
            // if the room is accessible, resolve the promise and continue access to the room
            if(response.data.access) {
              console.log('Room is accessible');
              deferred.resolve()
            // if the room is not accessible, reject the promise and change the state to 404
            } else {
              console.log('Room is not accessible');
              deferred.reject('Room is not accessible');
              $state.go('404');
            }
          });
          return deferred.promise;
      }];

      // Register all states for the application
      $stateProvider
        .state('home', {
            url: '/',
            controller: 'homeCtrl',
            templateUrl: 'app/home/home.html',
            resolve: {
              authenticated: authenticated
            }
        })
        .state('landingPage', {
            url: '/',
            controller: '',
            templateUrl: 'app/landingPage/landingPage.html'
        })
        .state('room', {
            url: '/room/:roomId',
            controller: 'roomCtrl',
            templateUrl: 'app/room/room.html',
            resolve: {
              access: access
            }
        })
        .state('404', {
          url: '/404',
          controller: '404Ctrl',
          templateUrl: 'app/404/404.html'
        })
        .state('demo', {
            url: '/demo/:roomId',
            controller: 'roomCtrl',
            templateUrl: 'app/room/room.html',
            resolve: {
              access: access
            }
        });
        // Attach token to all requests
        // $httpProvider.interceptors.push('AttachTokens');
  })
  
  .run(function ($rootScope, $state, $log) {
    $rootScope.$on('$stateChangeError', function () {
      // Redirect user to our home page
      $state.go('home', {reload: true});
    });
  });
  console.log('App loaded successfully');
})();

(function(){

  var app = angular.module('hackbox');

  app.filter('interviewFilter', function () {
    return function (items, time) {
      var filtered = [];
      var now = Date.now();
      var today = new Date();

      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var startDay = new Date(item.start_time);
        // Convert MS to just day
        // Add 24 hrs to it, this will be the MS for the next day
        // Past is now anything that is not today, but also before us by 24 hrs. 
        // Upcoming is anything that is not today, but also after us by 24 hrs. 

        switch(time){
          case 'Today':
            if (startDay.setHours(0,0,0,0) === today.setHours(0,0,0,0)) {
              filtered.push(item);
            }
            break;
          case 'Upcoming':
            if (startDay.setHours(0,0,0,0) > today.setHours(0,0,0,0)) {
              filtered.push(item);
            }
            break;
          case 'Completed':
            if (startDay.setHours(0,0,0,0) < today.setHours(0,0,0,0)) {
              filtered.push(item);
            }
            break;
          default:
            break;
        }
      };
      return filtered;
    };
  });

})();

/**
 * authFactory.js
 *
 * This factory/service is responsible for handling all the client-side authentication.
 */

(function(){

  angular
    .module('hackbox')
    .factory('Auth', Auth);

  Auth.$inject = ['$http', '$location', '$window', '$state'];

  function Auth($http, $location, $window, $state){

    var instance = {
      signIn: signIn,
      logout: logout,
      isAuthenticated: isAuthenticated
    };

    return instance;

    ///// IMPLEMENTATION /////

    /**
     * Function: Auth.signIn()
     * This function will make a POST request to the server to signin the user
     */
    function signIn(){
      return $http({
        method: 'GET',
        withCredentials: true,
        url: '/auth/github'
      }).then(function(response){
        return response;        
      });
    }
    
    /**
     * Function: Auth.logout()
     * This function will unauthenticate the user
     */
    function logout(){
      return $http({
        method: 'GET',
        url: '/auth/logout'
      }).then(function(response){
        $state.go('home', {}, {reload: true});
        return response;        
      });
    }
    
    /**
     * Function: Auth.isAuthenticated()
     * This function will unAuthenticate the user by removing the local storage object. 
     */
    function isAuthenticated(){
      return $http({
        method: 'POST',
        url: '/auth/checkloggedin'
      });
    }
  }
})();
/**
 * authTokenFactory.js
 *
 * This is a service designed for the httpInterceptor. 
 * When outgoing requests are made, this service attaches information to the request header
 * regarding the user such as the session token. 
 */

(function(){

  angular
    .module('hackbox')
    .factory('AttachTokens', AttachTokens);

  AttachTokens.$inject = ['$window'];

  function AttachTokens ($window) {

    var instance = {
      request: request
    };

    return instance;

    ///// IMPLEMENTATION /////

    /**
     * this is an $httpInterceptor
     * its job is to stop all out going request
     * then look in local storage and find the user's token
     * then add it to the header so the server can validate the request
     */
    function request (object) {
      var token = $window.localStorage.getItem('hackboxAuth');
      if (token) {
        object.headers['x-access-token'] = token;
      }
      object.headers['Allow-Control-Allow-Origin'] = '*';
      return object;
    }
  }
})();
/**
 * homeCtrl.js
 *
 * This is the controller responsible for the main landing page. 
 */ 

(function(){

  angular
    .module('hackbox')
    .controller('homeCtrl', HomeCtrl);

  HomeCtrl.$inject = ['$scope' ,'$modal', '$state','$log', 'Auth', 'Room'];

  function HomeCtrl($scope, $modal, $state, $log, Auth, Room){
    $scope.showCreateInterview = false;
    $scope.showLoadingCreateInterview = false;
    $scope.isLoggedIn = false;
    $scope.timeframe = 'Upcoming';
    $scope.interviewOrder = '+start_time';
    $scope.incompleteInterviews = [];
    $scope.newInterview = {};

    /**
     * Function: HomeCtrl.init()
     * This function will initialize the home page. If the user is logged in,
     * they will see a list of interviews coming up. Otherwise nothing. 
     */
    $scope.init = function(){
      // Check if the user is logged in
      Auth.isAuthenticated().then(function(response){
        if(response.data){
          console.log("User is logged in, getting all interviews.")
          $scope.showCreateInterview = true;
          $scope.isLoggedIn = true;

          // Refresh all interviews and display
          $scope.refreshInterviews();
        }
        else{
          console.log('User is not logged in');
        }
      });
    };

    /**
     * Function: HomeCtrl.logout()
     * This function will log the user out.
     */
    $scope.logout = function () {
      Auth.logout().then(function(){
        $scope.isLoggedIn = false;
      });
      console.log('Logging out!');
    };

    /**
     * Function: HomeCtrl.joinRoom()
     * This function will join a room with a particular roomId
     */
    $scope.joinRoom = function(interview){
      console.log('Joining: ' + interview.roomId);
      $state.go('room', {roomId: interview.roomId})
    } 

    /**
     * Function: HomeCtrl.remove()
     * This function will remove a room from the user's list and resync with database
     */
    $scope.remove = function(roomId){
      Room.deleteRoom(roomId, $scope.refreshInterviews);
    }

    /**
     * Function: HomeCtrl.quickRoom()
     * This function will create a random room for a user. 
     */
    $scope.quickRoom = function(){
      var room = {
        time: new Date(),
        user: 'Demo User',
        email: 'demoUser@email.com',
        name: 'Demo Room'
      };

      Room.createRoom(room,function(response){
        console.log(response);
        $state.go('demo', {roomId: response.data._id})
      });
    };

    /**
     * Function: refreshInterviews()
     * This function will refresh all interviews for a user and add them to 
     * a list. 
     */
     $scope.refreshInterviews = function(){
      $scope.incompleteInterviews = [];
      $scope.showLoadingCreateInterview = true;
      
      Room.getUpcomingInterviews(function(response){
        var allInterviews = response.data;

        // If there are interviews that came back, populate our list with them
        if(allInterviews.length > 0){
          // Populate incompleteInterviews with snapshot
          allInterviews.forEach(function(interview){
            console.log(interview);
            var emptyObj = (Object.keys(interview).length === 0);
            if(!emptyObj) {
              var interview = {
                start_time: interview.start_time,
                displayed_date: new Date(interview.start_time).toLocaleString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' }),
                displayed_time: new Date(interview.start_time).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', timeZoneName: 'short' }),
                candidateName: interview.candidateName,
                candidateEmail: interview.candidateEmail,
                created_by: interview.created_by,
                roomId: interview.id
              };
              $scope.incompleteInterviews.push(interview);
              $scope.showLoadingCreateInterview = false;
            }
          });
        }
        // If there are no interviews that came back, then we display nothing
        else {
          $scope.showLoadingCreateInterview = false;
        }
      });
    }

    $scope.setInterviewFilter = function(timeframe){
      $scope.timeframe = timeframe;

      if(timeframe === 'Completed')
        $scope.interviewOrder = '-start_time';
      else if(timeframe === 'Upcoming')
        $scope.interviewOrder = '+start_time';
      else
        $scope.interviewOrder = '+start_time';
    };

    $scope.init();
  }
})();

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
    /////////// Scope Variables and Constants //////////
    $scope.showCanvas = false;            // Shows/hides canvas
    $scope.saving = false;                // Shows/hides saving spinner
    $scope.roomId = $stateParams.roomId;  // Current RoomId
    $scope.isPeerTyping = false;          // Shows/hides typing message when receiving text
    $scope.videoToggle = false;           // Flips webcam
    $scope.displayOpen = false;           // Shows/hides Open Button to open a room
    $scope.displayClose = false;          // Shows/hides Close Button to close a room
    $scope.isCreator = false;             // Determines if a user was the creator of a room
    $scope.startTime;                     // Tracks start time of room as given by server
    $scope.endTime;                       // Tracks end time of room as given by server

    var isTypingPromise = null;           // Helps act as a timer reset
    var AUTOSAVE_FREQUENCY_MS = 60000;    // Frequency of auto-save feature in ms
    var saveInterval = null;              // Interval that will run the auto-save feature
    ///////// End Scope Variables and Constants /////////

    ////////////////// Event Listeners //////////////////
    /**
     * The $destroy event is called when we leave this view
     */
    $scope.$on('$destroy', function(){
      $scope.uninit();
      clearInterval(saveInterval);
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

        // Initialize text editors and notes if needed
        // Assign the save keyboard shortcut to each editor
        if(response.data.creator){
          TextEditor.initNotes(response.data.notes);
          TextEditor.assignKBShortcutsNotes($scope.saveTextAndCanvasData);
        }
        
        TextEditor.init(response.data.text);
        TextEditor.assignKBShortcuts($scope.saveTextAndCanvasData);

        // Update the canvas with the saved data
        if(response.data.canvas){
          Drawing.updateCanvas(response.data.canvas);
        }

        $scope.isCreator = response.data.creator;
        $scope.displayOpen = response.data.displayOpen;
        $scope.displayClose = response.data.displayClose;
        $scope.startTime = new Date(response.data.start_time).toLocaleString();
        $scope.endTime = new Date(response.data.end_time).toLocaleString();

        // Start interval for saving
        saveInterval = setInterval(function(){
          $scope.saveTextAndCanvasData();
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
     * Function: RoomCtrl.saveData(dataObj)
     * This function is the core save function. Any saving function should pass the object
     * to save to this function. 
     *
     * @param dataObj: The object to send to the server to save. This needs a roomId
     * and some data to save. The server will update all fields that match in the model.
     */
    $scope.saveData = function(dataObj) {
      Room.saveRoom(dataObj, function(){
        $scope.saving = false;
      });
    };

    /**
     * Function: RoomCtrl.saveTextAndCanvasData()
     * This function will save the Text and Canvas to the database.
     */
    $scope.saveTextAndCanvasData = function() {
      $scope.saving = true;

      // Get canvas data and text editor data
      var canvas = JSON.stringify(Drawing.getCanvas().toJSON());
      var text = [];
      TextEditor.getEditors().forEach(function(editor){
        var editorObj = {editorId: editor.id, data: editor.editor.getSession().getValue()}
        text.push(editorObj);
      });

      var roomData = {
        roomId: $scope.roomId,
        canvas: canvas,
        text: text
      };
      
      // Append the notes if creator. 
      if($scope.isCreator){
        roomData.notes = TextEditor.getNotes().editor.getSession().getValue();
      }

      $scope.saveData(roomData);
    };

    /**
     * Function: RoomCtrl.saveTimeData(startTime, endTime)
     * This function will save the start and end time to the database
     */
    $scope.saveTimeData = function(startTime, endTime) {
      $scope.saving = true;

      var timeData = {
        roomId: $scope.roomId,
        start_time: Date.parse(startTime),
        end_time: Date.parse(endTime)
      };

      $scope.saveData(timeData);
    }

    /**
     * Function: RoomCtrl.toggleCanvas(forceCanvasOff)
     * This function will toggle the canvas on/off.
     *
     * @param forceCanvasOff: True will force the canvas off.
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
    
    /**
     * Function: RoomCtrl.clearCanvas()
     * This function will clear the canvas
     */
    $scope.clearCanvas = function() {
      Drawing.clearCanvas();
    };

    /**
     * Function: RoomCtrl.toggleEraser()
     * This function will turn on/off the eraser
     */
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

    /**
     * Function: RoomCtrl.openRoom()
     * This function will change the start time of a room, opening it up.
     */
    $scope.openRoom = function(){
      $scope.startTime = new Date().toLocaleString();
      $scope.saveTimeData($scope.startTime, $scope.endTime);
      $scope.displayOpen = false;
      $scope.displayClose = true;
    };

    /**
     * Function: RoomCtrl.closeRoom()
     * This function will change the end time of a room to the current time + 1 minute
     */
    $scope.closeRoom= function(){
      $scope.endTime = (new Date() + 60000).toLocaleString();
      $scope.saveTimeData($scope.startTime, $scope.endTime);
      $scope.displayClose = false;
    };
    //////////////////   End Room Methods   //////////////////

    // Call the initialize function
    console.log('Joining Interview with ID: ' + $stateParams.roomId);
    $scope.init();
  }
})();

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

    function saveRoom(roomData, callback){
      console.log('Saving canvas and text editor data...');
      return $http({
        method: 'POST',
        url: '/room/save',
        data: roomData
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
      comm.connect(roomName, {limit: 5, audio: true});

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
          $scope.peerVideoSource = '';
          $scope.peerVideoConnected = false;
      });
    };

    /**
     * Function: VideoCtrl.uninit()
     * This function will be called when we leave a room.
     * It will shut down the video and audio stream.
     */
    $scope.uninit = function(){
      console.log('Shutting down video and removing listeners.');
      IcecommWrapper.uninitialize();
    };
    
    $scope.init($stateParams.roomId);
  }

})();

/**
 * icecommFactory.js
 *
 * This is a wrapper for icecomm.js and a service designed to handle
 * the video and audio transmission within a given room.
 * It also is capable of data transfer to entities within a specific room.
 * It uses Icecomm.js and maintains the instance to Icecomm.
 */

(function(){

  angular
    .module('hackbox')
    .factory('IcecommWrapper', IcecommWrapper);

  IcecommWrapper.$inject = [];

  function IcecommWrapper(){
    var comm = null;
    
    var instance = {
      getIcecommInstance: getIcecommInstance,
      setDataListener: setDataListener,
      uninitialize: uninitialize
    };

    return instance;

    ///// IMPLEMENTATION /////

    /**
     * Function: Icecomm.getIcecommInstance()
     * This function returns an Icecomm object. If it does not exist, it creates one. 
     *
     * @return: The Icecomm instance if possible, or else null. 
     */
    function getIcecommInstance(){
      if(!comm){
        comm = new Icecomm('RyGfR1DIOhvNIeu8EYuBxK1lRoZoiAkEOeo1ZihAvLLz0R', {debug: true});
      }
      return comm;
    };

    /**
     * Function: Icecomm.setDataListener(callback)
     * This function sets a callback to execute when the 'data' event is heard 
     *
     * @param callback: The function to run after hearing 'data' event 
     */
    function setDataListener(callback){
      getIcecommInstance().on('data', callback);
    };

    /**
     * Function: Icecomm.uninitialize()
     * This function will leave current room, stop local audio/video stream 
     * and call the 'disconnect' event on all users in room.
     *
     * @return: A boolean determining if the uninitialization was successful. 
     */
    function uninitialize(){
      if(!!comm){
        console.log('Stopping Video');
        
        comm.leave(true); 
        return true;
      }
      return false;
    };
  }
})();
/**socketFactory.js
 *
 * This is a service designed to sync the canvas and text editor for both 
 * members of a room. 
 * It works using sockets.io where this factory wraps the socket Object
 */
(function() {
  angular
  .module('hackbox')
  .factory('Sockets', Sockets);

  Sockets.$inject = [];

  function Sockets() {
    var socket = io.connect();
    var instance = {
      on: on,
      emit: emit,
      disconnect: disconnect
    };
    return instance;

  //// IMPLEMENTATION ////

    /**Function: Sockets.on()
     *
     * This Function listens for generic socket events from the server
     */
    function on(eventName, callback) {
      socket.on(eventName, function() {
        var args = Array.prototype.slice.call(arguments);
        if( callback ) {
          callback.apply(socket, args);
        }
      });
    }
    
    /**Function: Sockets.emit()
     *
     * This Function emits generic socket events, sends the data to the server
     * and then also will execute a callback if specified
     */
    function emit(eventName, data, callback) {
      socket.emit(eventName, data, function() {
        var args = Array.prototype.slice.call(arguments);
        if( callback ) {
          callback.apply(socket, args);  
        }     
      });
    }

    function disconnect() {
      console.log('disconnecting socket');
      socket.disconnect();
    }
  }
})();
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
/**
 * canvasFactory.js
 *
 * This is a service designed to handle the drawing on canvas functionality within a given room.
 * It uses fabric.js, a library on top of HTML5 canvas
 * The data will be continually synced via WebSockets and saved at the end
 */

(function() {
  angular
    .module('hackbox')
    .factory('Drawing', Drawing);

  Drawing.$inject = ['Sockets', '$stateParams'];

  function Drawing(Sockets, $stateParams) {
    var _fabricCanvas = null;
    var _socket = null;
    var _intervalID = null;
    var _currentlyErasing = false;
    var _currentlyDrawing = false;
    var _pendingData = false;

    var instance = {
      makeCanvas: makeCanvas,
      initializeIO: initializeIO,
      stopIO: stopIO,
      clearCanvas: clearCanvas,
      getCanvas: getCanvas,
      toggleEraser: toggleEraser,
      updateCanvas: updateCanvas,
      removeCanvas: removeCanvas
    };

    return instance;

    //// IMPLEMENTATION /////

    /**
     * Function: Drawing.makeCanvas()
     * This Function will create and return a new HTML% canvas element
     * set its initial position, id and size it can then be appended to the DOM where/when desired
     * 
     * @return: Canvas element to append to DOM. 
     */
    function makeCanvas() {
      console.log('making a canvas');
      var newCanvas = $('<canvas></canvas>')
        .attr('id', 'drawingCanvas');

      $('.drawing-container').append(newCanvas);

      _fabricCanvas = new fabric.Canvas('drawingCanvas', {
        isDrawingMode: true
      });

      _fabricCanvas.setHeight(2000);
      _fabricCanvas.setWidth(2000);

      return _fabricCanvas;
    }

    function clearCanvas() {
      _fabricCanvas.clear();
      Sockets.emit('clearCanvas');
    }

    function initializeIO(isPeerDrawing) {
      _isPeerDrawing = isPeerDrawing;

      console.log('Initializing Sockets IO');
      _socket = io();

      Sockets.on('greeting', function (initialData) {
       console.log('Socket connection initialized!', initialData);
       Sockets.emit('join room', {roomName: $stateParams.roomId});
      });

      Sockets.on('coordinates', updateCanvas);

      Sockets.on('clearCanvas', function() {
        _fabricCanvas.clear();
      });

      _fabricCanvas.on('mouse:down', function(isPeerDrawing) {
        _currentlyDrawing = true;
        Sockets.emit('toggleDrawingMessage');
      });




      _fabricCanvas.on('mouse:up', function() {
        _currentlyDrawing = false;
        Sockets.emit('toggleDrawingMessage');
        sendData();
      });       
    }

    function toggleEraser() {
     if (_currentlyErasing ) {
      _fabricCanvas.freeDrawingBrush = new fabric['Pencil' + 'Brush'](_fabricCanvas);
      _fabricCanvas.freeDrawingBrush.width = 1;
      _fabricCanvas.freeDrawingBrush.color = '#000000';
      _currentlyErasing = !_currentlyErasing;

     } else {
      _fabricCanvas.freeDrawingBrush = new fabric['Circle' + 'Brush'](_fabricCanvas);
      _fabricCanvas.freeDrawingBrush.width = 20;
      _fabricCanvas.freeDrawingBrush.color = '#FFFFFF';      
      _currentlyErasing = !_currentlyErasing;
     }
    }

    function stopIO() {
      Sockets.stopIO();
    }

    /**
     * Function: Drawing.getCanvas()
     * This function is a getter for the canvas. 
     *
     * @return: The instance of the canvas
     */
    function getCanvas(){
      return _fabricCanvas;
    }

    /**
     * Function: Drawing.removeCanvas(containerClassName)
     * This Function finds a canvas on screen with the specified id
     * and then removes the canvas
     *
     * @param containerClassName: The class to find elements by in the DOM. 
     * @return: True if canvas was removed, false if no action was taken. 
     */
    function removeCanvas() {
      var canvas = $('.canvas-container'); //this might need to be the lower canvas
      if( canvas ) {
        canvas.remove();
        return true;
      }
      return false;
    }

    //Function: Drawing.updateCanvas()
    //This Function takes in canvas data in the stringified png format
    //It then updates the canvas with the data
    //This happens on every mousemove (really mouseup)
    function updateCanvas(data) {
      _pendingData = true;
      var pollCanvasStatus = function() {
        if ( _currentlyDrawing ) { //wait till done drawing
          setTimeout(function() {
            pollCanvasStatus();
          }, 100);
        } else {
          _pendingData = false;
          setTimeout(function() {
          _fabricCanvas.loadFromJSON(data, _fabricCanvas.renderAll.bind(_fabricCanvas));
          }, 100);
        }
      };
      pollCanvasStatus();
    }

    function sendData() {
      if ( _pendingData ) {
        console.log('Data Pending!');
      } else {
        var json = JSON.stringify( _fabricCanvas.toJSON());
        Sockets.emit('coords', json);        
      }
    }
  }
})();
/** 
 * textEditorCtrl.js
 * 
 * This is the controller responsible for the text editors in a room.
 */

(function(){

  angular
    .module('hackbox')
    .controller('textEditorCtrl', TextEditorCtrl);

  TextEditorCtrl.$inject = ['$scope' , 'TextEditor'];

  function TextEditorCtrl($scope, TextEditor){
    $scope.editors = TextEditor.getEditors();
    $scope.notes = TextEditor.getNotes();

    // The $destroy event is called when we leave this view
    $scope.$on('$destroy', function(){
      console.log('Destroying text editors');
      TextEditor.removeAllEditors();
    });

    /**
     * Function: TextEditorCtrl.addTextEditor()
     * This function will add a new text editor to the DOM. 
     */
    $scope.addTextEditor = function(saveFn){
      var editorId = TextEditor.addTextEditor();
      TextEditor.assignKBShortcuts(saveFn);

      if(editorId !== null)
        TextEditor.peerAddEditor(editorId);
    };

    /**
     * Function: TextEditorCtrl.removeTextEditor(editorId)
     * This function will remove a text editor from the DOM.
     *
     * @param editorId: An integer representing the ID of an editor object. Range(0 - MAX_EDITORS)
     */
    $scope.removeTextEditor = function(editorId){
      TextEditor.removeTextEditor(editorId);
      TextEditor.peerRemoveEditor(editorId);
    };

    /**
     * Function: TextEditorCtrl.setActiveEditor(editorId)
     * This function will set the editor in the collection with the matching Id as the active editor 
     *
     * @param editorId: An integer representing the ID of an editor object. Range(0 - MAX_EDITORS)
     */
    $scope.setActiveEditor = function(editorId){
      TextEditor.setActiveEditor(editorId);
    };

    /**
     * Function: TextEditorCtrl.setActiveNotes(notesEditorId)
     * This function will set the notes editor as the active editor 
     *
     * @param notesEditorId: An integer representing the ID of an editor object. (MAX_EDITORS + 1)
     */
    $scope.setActiveNotes = function(notesEditorId){
      TextEditor.setActiveNotes(notesEditorId);
    };

    /**
     * Function: TextEditorCtrl.removeTextEditor(editorId)
     * This function will set the editor in the collection with the matching Id as the active editor 
     *
     * @param editorId: An integer representing the ID of an editor object. Range(0 - MAX_EDITORS)
     */
    $scope.deactivateTabs = function(){
      TextEditor.deactivateTabsAndEditors();
    };
  }

})();

/** 
 * textEditorFactory.js
 * 
 * This is a service responsible for appending an Ace text editor to the DOM. 
 * It also assists in editing the editor elements. 
 */

(function() {
  angular
    .module('hackbox')
    .factory('TextEditor', TextEditor);

  TextEditor.$inject = ['$rootScope', 'IcecommWrapper'];

  function TextEditor($rootScope, IcecommWrapper) {
    var _editors = [];
    var _notes = {};
    var _okToSend = true;
    var MAX_EDITORS = 3;

    var instance = {
      init: init,
      initNotes: initNotes,
      addTextEditor: addTextEditor,
      setActiveEditor: setActiveEditor,
      setActiveNotes: setActiveNotes,
      resizeAllEditors: resizeAllEditors,
      removeTextEditor: removeTextEditor,
      removeAllEditors: removeAllEditors,
      deactivateTabsAndEditors: deactivateTabsAndEditors,
      assignKBShortcuts: assignKBShortcuts,
      assignKBShortcutsNotes: assignKBShortcutsNotes,
      peerAddEditor: peerAddEditor,
      peerRemoveEditor: peerRemoveEditor,
      getEditors: getEditors,
      getNotes: getNotes
    };

    return instance;

    ////////////////// Text Editor Methods //////////////////
    /**
     * Function: TextEditor.init(savedEditors)
     * This function initialize the text editors given. 
     *
     * @param savedEditors: An array of editor objects to initialize the state of each editor to
     */
    function init(savedEditors){
      loadSavedEditors(savedEditors);
      initializeDataListener();
    }

    /**
     * Function: TextEditor.initNotes(notes)
     * This function will initialize the note editor.
     *
     * @param notes: A string representing the text to set for the note editor. 
     */
    function initNotes(notes){
      loadSavedNotes(notes);
    }

    /**
     * Function: TextEditor.addTextEditor(id)
     * This function will add a new text editor to the DOM. 
     *
     * @param id: Overloaded, will set a particular editor with id provided if possible. 
     */
    function addTextEditor(id){
      var editorId = null;

      if(_editors.length < MAX_EDITORS){
        editorId = nextSmallestId(_editors, MAX_EDITORS);

        // Get the id to assign
        if(id !== undefined && _editors[id] === undefined){
          editorId = id;
        } else{
          editorId = nextSmallestId(_editors, MAX_EDITORS);
        }

        // Hide all editors and tabs
        deactivateTabsAndEditors();

        // Add new editor, starts as active.
        var tab = {name: 'Tab ' + (editorId + 1),
                   active: true}; 
        var editor = {id: editorId, 
                      tab: tab, 
                      editor: createEditor('#editors',editorId) };

        // Setup ace editor listener for change event in text
        setEditorOnChangeListener(editor);

        _editors.push(editor);
      }
      else{
        console.log('Cannot have more than ' + MAX_EDITORS + ' editors!');
      }
      return editorId; 
    };

    /**
     * Function: TextEditor.setActiveEditor(editorId)
     * This function will set the editor in the collection with the matching Id as the active editor 
     *
     * @param editorId: An integer representing the ID of an editor object. Range(0 - MAX_EDITORS)
     */
    function setActiveEditor(editorId){
      var editorToFocusOn = indexOfEditorWithId(editorId);
      // Hide all tabs and editors.
      deactivateTabsAndEditors();

      // Add 'activeEditor' class to the editor with the correct id. Also set the tab as active.
      setEditorActive(editorId);
      _editors[editorToFocusOn].tab.active = true;

      // Focus on the editor and set cursor to end.
      _editors[editorToFocusOn].editor.focus();
      _editors[editorToFocusOn].editor.navigateLineEnd();
    };

    /**
     * Function: TextEditor.setActiveEditor(editorId)
     * This function will set the notes editor as the active editor 
     *
     * @param noteEditorId: An integer representing the ID of an editor object. (MAX_EDITORS + 1)
     */
    function setActiveNotes(notesEditorId){
      // Hide all tabs and editors.
      deactivateTabsAndEditors();

      // Add 'activeEditor' class to the editor with the correct id. Also set the tab as active.
      setEditorActive(notesEditorId);
      _notes.tab.active = true;

      // Focus on the editor and set cursor to end.
      _notes.editor.focus();
      _notes.editor.navigateLineEnd();
    };

    /**
     * Function: TextEditor.removeTextEditor(editorId)
     * This function will remove a text editor from the DOM.
     *
     * @param editorId: An integer representing the ID of an editor object. Range(0 - MAX_EDITORS)
     */
    function removeTextEditor(editorId){
      var switchEditorFocus = false;

      if(_editors.length > 1){
        // Determine if the currently activeEditor is the one being removed
        if( $('.activeEditor').attr('id') === 'editor' + editorId )
          switchEditorFocus = true;

        // Remove the element from the DOM by element Id
        var id = '#editor' + editorId;
        $(id).remove();

        // Destroy the editor and splice the element with the matching id out of _editors
        var idxToRemove = indexOfEditorWithId(editorId);
        if(idxToRemove !== -1){
          _editors[idxToRemove].editor.destroy();
          _editors.splice(idxToRemove,1);
        }

        // Set active editor if needed
        if(switchEditorFocus){
          if(idxToRemove < _editors.length)
            setActiveEditor(_editors[idxToRemove].id);
          else
            setActiveEditor(_editors[idxToRemove-1].id);
        }
      }
    };

    /**
     * Function: TextEditor.removeAllEditors()
     * This function will be called when we leave a room.
     * It will destroy all editors currently in use. 
     */
    function removeAllEditors(){
      // Remove all text editors
      _editors.forEach(function(editor){
        editor.editor.destroy();
      });

      if(_notes.hasOwnProperty('editor'))
        _notes.editor.destroy();

      _notes = {};
      _editors = [];
    };

    /**
     * Function: TextEditor.resizeAllEditors()
     * This function will rerender all the editors. 
     * This helps the user experience when changing visibility
     */
    function resizeAllEditors(){
      // Force a rerender of editors
      _editors.forEach(function(editor){
        editor.editor.resize();
        editor.editor.renderer.updateFull()
      });
    };

    /**
     * Function: assignKBShortcuts(saveFn)
     * This function will assign the KB shortcut for saving to the editor. 
     *
     * @param saveFn: The callback function to call when KB shortbut is pressed
     */
    function assignKBShortcuts(saveFn){
      // Assign the save keyboard shortcut to each editor
      _editors.forEach(function(editor){
          editor.editor.commands.addCommand({  name: 'saveFile',
                                        bindKey: {
                                        win: 'Ctrl-S',
                                        mac: 'Command-S',
                                        sender: 'editor|cli'
                                     },
                                      exec: saveFn
          });
      });
    }

    /**
     * Function: assignKBShortcutsNotes(saveFn)
     * This function will assign the KB shortcut for saving to the editor. 
     *
     * @param saveFn: The callback function to call when KB shortbut is pressed
     */
    function assignKBShortcutsNotes(saveFn){
      // Assign the save keyboard shortcut to the notes object
      _notes.editor.commands.addCommand({  name: 'saveFile',
                                    bindKey: {
                                    win: 'Ctrl-S',
                                    mac: 'Command-S',
                                    sender: 'editor|cli'
                                 },
                                  exec: saveFn
      });
    }

    /**
     * Function: peerAddEditor()
     * This function will send a command to the peer to add an editor
     */
    function peerAddEditor(editorId){
      console.log('Add editor to peer!')
      IcecommWrapper.getIcecommInstance().send({command: 'addEditor', editorId: editorId});
    }

    /**
     * Function: peerRemoveEditor(editorId)
     * This function will send a command to the peer to remove an editor
     *
     * @param editorId: The editorId to remove for the peer
     */
    function peerRemoveEditor(editorId){
      console.log('Remove Editor to peer!')
      IcecommWrapper.getIcecommInstance().send({command: 'removeEditor', editorId: editorId});
    }

    /**  
     * Function: TextEditor.getEditors()
     * This function will return the list of editors currently in use
     *
     * @return : A list of editor objects. 
     */
    function getEditors(){
      return _editors;
    }

    /**  
     * Function: TextEditor.getNotes()
     * This function will return the notes editor object
     *
     * @return : The notes editor object
     */
    function getNotes(){
      return _notes;
    }
    ///////////////////// End Text Editor Methods //////////////////////

    ///////////////////////// Helper Functions /////////////////////////

    /**  
     * Function: createEditor(elementToAppendTo, editorId)
     * This function will append a new Ace editor to the DOM at the specified element in the DOM.
     * It will return the instance of the editor. 
     *
     * @param elementToAppendTo: The DOM element to append an editor to. 
     * @param editorId: The editor ID # for later reference to the editor. 
     * @return: The editor instance. 
     */
    function createEditor(elementToAppendTo, editorId){
      $(elementToAppendTo).append('<div class="editor activeEditor" id="editor'+ editorId + '"></div>');

      var editor = ace.edit('editor' + editorId);
      var defaultText = '// Enter code here.';

      editor.$blockScrolling = Infinity;
      editor.setTheme("ace/theme/monokai");
      editor.getSession().setMode("ace/mode/javascript");
      editor.setShowPrintMargin(false);
      editor.setValue(defaultText,1);
      editor.focus();
      editor.navigateLineEnd();

      return editor;
    }

    /**  
     * Function: addNotesEditor()
     * This function will add a notes editor to the dom with an ID of MAX_EDITORS + 1
     */
    function addNotesEditor(){
      // Add new editor, starts as active.
      var tab = {name: 'Notes',
                 active: false}; 

      _notes.id = MAX_EDITORS + 1;
      _notes.tab =  tab;
      _notes.editor = createEditor('#editors', MAX_EDITORS+1);
    };

    /**  
     * Function: TextEditor.initializeDataListener()
     * This function will initialize all entities upon switching the the room state.
     */
    function initializeDataListener(){
      var comm = IcecommWrapper.getIcecommInstance();

      // Sync with peer if first into room
        comm.on('connected', function(peer) {
          if(comm.isHost()){
            console.log('Sending Peer my data')
            _editors.forEach(function(editor){
              if(_okToSend)
                comm.send({command: 'setData', 
                           data: editor.editor.getSession().getValue(), 
                           editorId: editor.id});
            });
          }
        });

      // Start data listener for peer data transfers
      IcecommWrapper.setDataListener(onPeerData);
    };
    
    /**  
     * Function: TextEditor.setEditorOnChangeListener(editor)
     * This function will set the 'change' event listener on the ace editor given
     *
     * @params editor: The editor object to set the change event on. 
     */
    function setEditorOnChangeListener(editor){
      editor.editor.on('change', function(event){
        var text = editor.editor.getSession().getValue();
        var editorId = editor.id;

        if(_okToSend)
          IcecommWrapper.getIcecommInstance().send({command: 'setData',
                                                    data: text, 
                                                    editorId: editorId});
      });
    }

    /**
     * Function: TextEditor.setEditorText(text, editorId)
     * This function will set the text in an editor with a given id to text
     *
     * @param text: The text to place in the editor
     * @param editorId: The ID of the editor to change 
     */
    function setEditorText(text, editorId){
      var editorIdx = indexOfEditorWithId(editorId);

      if(editorIdx !== -1){
        var cursorPos = _editors[editorIdx].editor.getCursorPosition();
        _editors[editorIdx].editor.getSession().setValue(text,1);
        _editors[editorIdx].editor.moveCursorToPosition(cursorPos);
      }
    };

    /**
     * Function: TextEditor.setNotesText(text)
     * This function will set the text in the notes editor
     *
     * @param text: The text to place in the editor
     */
    function setNotesText(text){
      var cursorPos = _notes.editor.getCursorPosition();
      _notes.editor.getSession().setValue(text,1);
      _notes.editor.moveCursorToPosition(cursorPos);
    };

    /**  
     * Function: setEditorActive(editorId)
     * This function will add the class 'active' to the specified element with "id='editorX'"
     *
     * @param editorId: The ID # of the element to find in the DOM. 
     */
    function setEditorActive(editorId){
      var id = '#editor' + editorId;
      $(id).addClass('activeEditor');
    }

    /**  
     * Function: deactivateAllEditors()
     * This function will find all elements with the class='editor' and remove the class 'active'
     * from them. Essentially, hiding that element. 
     */
    function deactivateAllEditors(){
      $('.editor').removeClass('activeEditor');
    }

    /**
     * Function: deactivateTabsAndEditors()
     * A helper function to set all editors and tabs as inactive. 
     */
    function deactivateTabsAndEditors(){
      // Remove active class from all editors
      deactivateAllEditors();

      // Remove activeTab class from all tabs
      _editors.forEach(function(editor){
        editor.tab.active = false;
      });

      if(_notes.tab)
        _notes.tab.active = false;
    };

    /**
     * Function: loadSavedEditors(savedEditors)
     * A helper function to initialize all editors
     *
     * @params savedEditors: An array of editor objects from server to initialize editors to
     */
    function loadSavedEditors(savedEditors){
      // If there is text saved, set the editors text to that. 
      if(savedEditors && savedEditors.length > 0){
        savedEditors.forEach(function(savedEditor, i){
          addTextEditor(savedEditor.editorId);
          setEditorText(savedEditor.data, savedEditor.editorId);
        });
        setActiveEditor(savedEditors[0].editorId);
      } 
      else{
        addTextEditor();
      }
    }

    /**
     * Function: loadSavedNotes(notes)
     * A helper function to initialize the notes editor
     *
     * @params notes: The text to set
     */
    function loadSavedNotes(notes){
      addNotesEditor();
      setNotesText(notes);
    }

    /**
     * Function: onPeerData(peer)
     * A function to determine what actions to perform upon receiving commands from peer
     *
     * @params peer: The peer object from Icecomm
     */
    function onPeerData(peer){
      // Prevent user from sending data while receiving data
      _okToSend = false;
      switch(peer.data.command){
        case 'addEditor':
          $rootScope.$apply(function(){
            addTextEditor(peer.data.editorId);
          });
          break;

        case 'removeEditor':
          $rootScope.$apply(function(){
            removeTextEditor(peer.data.editorId);
          });
          break;

        case 'setData':
          // Emit an event for use
          $rootScope.$emit('receivingData');
          setEditorText(peer.data.data, peer.data.editorId)
          break;

        default:
          break;
      }
  
      // Editor is now ok to send data again. 
      _okToSend = true;
    }
    
    /**
     * Function: nextSmallestId(arr, limit)
     * A helper function to find the smallest editor.id # from 0 - limit
     * that does not exist currently in the editors collection.
     *
     * @param arr: A collection to iterate over. 
     * @param limit: The maximum value of an ID #
     * @return: The minimum ID # that does not currently exist within the collection. 
     */
    function nextSmallestId(arr, limit){
      var ids = {};
      for(var i = 0; i < arr.length; i++){
        var editor = arr[i];
        ids[editor.id] = true;
      }
      for(var i = 0; i < limit; i++){
        if(ids[i] !== true)
          return i;
      }
      return 0;
    };

    /**
     * Function: indexOfEditorWithId(editorId)
     * A helper function to find the smallest editor.id # from 0 - limit
     * that does not exist currently in the _editors collection.
     *
     * @param editorId: An integer representing the ID of the editor to find. Range(0 - MAX_EDITORS)
     * @return: The index in the _editors collection which corresponds to the editor with the 
     * matching Id. 
     */
    function indexOfEditorWithId(editorId){
      var idx = _editors.map(function(editor) {
                            return editor.id;
                          }).indexOf(editorId);
      return idx;
    }

    ///////////////////////// End Helper Functions /////////////////////////
  }
})();
(function(){

  angular
    .module('hackbox')
    .controller('signinCtrl', SigninCtrl);

  SigninCtrl.$inject = ['$scope', '$modal', '$log'];

  function SigninCtrl($scope, $modal, $log){
    
    $scope.openSigninModal = function () {
      var modalInstance = $modal.open({
        templateUrl: '/app/signin/signinModal.html',
        controller: 'signinModalCtrl'
      });
    };
  }
})();
/**
 * signinModalCtrl.js
 *
 * This is the controller responsible for the signin Modal that appears when
 * the signin button is clicked. 
 */

(function(){

  angular
    .module('hackbox')
    .controller('signinModalCtrl', SigninModalCtrl);

  SigninModalCtrl.$inject = ['$scope','$modalInstance', 'Auth'];

  function SigninModalCtrl($scope, $modalInstance, Auth){
    $scope.loading = false;

    $scope.submit = function () {
      Auth.signIn();
    };

    $scope.showLoading = function(){
      $scope.loading = true;
    };

    $scope.cancel = function () {
      $modalInstance.dismiss('cancel');
    };
  }
})();
(function(){

  angular
    .module('hackbox')
    .controller('scheduleCtrl', ScheduleCtrl);

  ScheduleCtrl.$inject = ['$scope', '$modal', '$log'];

  function ScheduleCtrl($scope, $modal, $log){
    
    $scope.openScheduleModal = function () {
      var modalInstance = $modal.open({
        templateUrl: '/app/schedule/scheduleModal.html',
        controller: 'scheduleModalCtrl',
        scope: $scope
      });
    };
  }
})();
/**
 * scheduleModalCtrl.js
 *
 * This is the controller responsible for the schedule Modal that appears when
 * the new interview button is clicked. 
 */

(function(){

  angular
    .module('hackbox')
    .controller('scheduleModalCtrl', ScheduleModalCtrl);

  ScheduleModalCtrl.$inject = ['$scope','$modalInstance', 'Room', '$state'];

  function ScheduleModalCtrl($scope, $modalInstance, Room, $state){
    $scope.loading = false;

    /**
     * Function: HomeCtrl.createInterview()
     * This function will create a new interview. It calls refresh to update the DOM
     * with the list of all interviews for the user. 
     */
    $scope.createInterview = function() {
      $scope.loading = true;
      Room.createRoom($scope.newInterview, function(){
        $scope.newInterview.sendEmail = false;
        $scope.newInterview.name = null;
        $scope.newInterview.email = null;
        $scope.newInterview.time = null;
        $scope.exitModal();
      });
    };

    $scope.exitModal = function() {
      setTimeout(function() {
        $scope.loading = false;
        $modalInstance.dismiss('cancel');
        $scope.refreshInterviews();
      }, 2000);
    };
  }
})();
/**
 * pastCtrl.js
 *
 * This is the controller responsible for the past interviews page. 
 */ 

(function(){

  angular
    .module('hackbox')
    .controller('404Ctrl', bigcontroller);

  bigcontroller.$inject = ['$scope' ,'$modal', '$state','$log', 'Auth', 'Room'];

  function bigcontroller($scope, $modal, $state, $log, Auth, Room){
    $scope.showCreateInterview = false;
    $scope.showLoadingCreateInterview = false;
    $scope.showLogout = false;
    $scope.incompleteInterviews = [];
    $scope.newInterview = {};

    /**
     * Function: 404Cntrl.init()
     * This function will initialize the home page. If the user is logged in,
     * they will see a list of interviews coming up. Otherwise nothing. 
     */
    $scope.init = function(){
      // Check if the user is logged in
      Auth.isAuthenticated().then(function(response){
        if(response.data){
          console.log("User is logged in, display logout.")
          $scope.showLogout = true;
        }
        else{
          console.log('User is not logged in');
        }
      });
    };

    /**
     * Function: 404Ctrl.logout()
     * This function will log the user out.
     */
    $scope.logout = function () {
      Auth.logout().then(function(){
        $scope.showLogout = false;
      });
      console.log('Logging out!');
    };

    $scope.init();
  }
})();

(function(){

  var app = angular.module('hackbox');

  app.directive('interviewBox', function() {
    return {
      restrict: 'E',
      templateUrl: '/app/directives/interviewBox/interviewBox.html',
      scope: {
        interview: '=',
        removeFn: '&'
      }
    };
  });

})();
