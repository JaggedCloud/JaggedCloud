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

    function initializeIO() {
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

      _fabricCanvas.on('mouse:down', function() {
        _currentlyDrawing = true;
      });


      _fabricCanvas.on('mouse:up', function() {
        _currentlyDrawing = false;
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