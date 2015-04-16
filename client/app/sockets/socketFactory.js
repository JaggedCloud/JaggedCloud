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