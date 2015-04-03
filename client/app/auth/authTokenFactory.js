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

    // this is an $httpInterceptor
    // its job is to stop all out going request
    // then look in local storage and find the user's token
    // then add it to the header so the server can validate the request
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