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
    $scope.showLogout = false;
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
          $scope.showLogout = true;

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
        $scope.showLogout = false;
      });
      console.log('Logging out!');
    };

    $scope.joinRoom = function(interview){
      console.log('Joining: ' + interview.roomId);
      $state.go('room', {roomId: interview.roomId})
    } 

    $scope.remove = function(roomId){
      Room.deleteRoom(roomId, $scope.refreshInterviews);
    }

    /**
     * Function: refreshInterviews()
     * This function will refresh all interviews for a user and add them to 
     * a list. 
     */
     $scope.refreshInterviews = function(){
      Room.getUpcomingInterviews(function(response){
        $scope.incompleteInterviews = [];
        // Populate incompleteInterviews with snapshot
        response.data.forEach(function(interview){
          console.log(interview);
          var interview = {
            displayedStart_time: new Date(Date.parse(interview.start_time)).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', weekday: 'short', year: 'numeric', month: 'long', day: 'numeric', timeZoneName: 'long'}),
            start_time: Date.parse(interview.start_time),
            candidateName: interview.candidateName,
            candidateEmail: interview.candidateEmail,
            created_by: interview.created_by,
            roomId: interview.id
          };
          $scope.incompleteInterviews.push(interview);
          $scope.showLoadingCreateInterview = false;
        });
      });
    }

    $scope.init();
  }
})();
