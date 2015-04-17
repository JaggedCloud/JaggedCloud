var Room = require('../db/models/roomModel');
var User = require('../db/models/userModel');
var mandrill = require('../email/message');

var handleError = function(error) {
  console.log('the following error has occurred: ' + error);
};



module.exports.create = function(req, res) {
  var startTime = req.body.time;
  var githubId = req.user;
  var email = req.body.email;
  var name = req.body.name;
  var isOpen = Date.now() >= Date.parse(startTime);


  Room.create({ created_by: githubId, start_time: startTime, is_open: isOpen, candidateName: name, candidateEmail: email }, function(err, room){
    if (err) {
      handleError(err);
      res.send(404, 'room not found');
    }
    else if (room) {
      console.log('room successfully created!');

      User.findOneAndUpdate({github_id: githubId}, {$push: {rooms: room._id}}, {upsert: true}, function(err, user){
        if (err) {
          handleError(err);
          res.send(404, 'user not found');
        }
        else if (user) {
          console.log('successfully added new room to user!' + user);
          mandrill.sendMessage({email:email, fullname: name})
        }
      });
      res.send(201, room);
    }      
  });
};


module.exports.save = function(req, res) {
  var notes = req.body.notes;
  var roomId = req.body.roomId;
  var canvas = req.body.canvas;
  var text = req.body.textEditor;

  Room.findOneAndUpdate({_id: roomId}, {canvas: canvas, text: text, notes: notes}, {upsert: true},
    function(err, room){
      if (err) { handleError(err); }
      else if (room) {
        console.log('room successfully updated');
        res.send(201, room);      
      }
    }
  );
};

// need to use req.PARAMS.id here because this is a get request
// maybe: complete candidateRoom object that contains only the data the the candidate should see
// (right now they're the same, but may add box for interviewer to take notes)
module.exports.fetchOne = function(req, res) {
  var roomId = req.params.id;
  var githubId = req.user;
  console.log(roomId);

  Room.findById(roomId, function(err, room){
    // var canvas = room.canvas;
    // var text = room.text;
    // var candidateRoom = {
    //   canvas: canvas,
    //   text: text
    // }
    // console.log(candidateRoom);
    if(room) {
      var isOpen = (Date.now() > Date.parse(room.start_time)) || githubId === room.created_by;
      console.log('is the room open', isOpen)
      if(isOpen) {
        res.send(200, room)
        return;
      }
    }
    if(err) { 
      // handleError(err);
      console.log('i hit an error', err)
      res.send(200, {data: '404'});
      return;
    }
    // if current user is room creator send back all room data, else send candidateRoom
    else {
      console.log('i hit an else');
      res.status(200).send({data: '404'}); // change to candidateRoom once obj is complete
    }
  });
};


// find user by id and retrieve rooms -- note: error handling is jank; pushes null to array if err
module.exports.fetchAll = function(req, res) {
  var githubId = req.user;
  var roomsArray = [];
  User.findOne({github_id: githubId}, 'rooms', function(err, user){
    if (err) { 
      handleError(err); 
      res.send(200, 'cannot find user by ID');
    }
    else if(user) {
      var rooms = user.rooms;

      // If the user's room list is empty, send back the empty array
      if(rooms.length === 0){
        res.send(202, roomsArray);
      }
      // If the user has rooms, send back data about each
      else {
        for (var i = 0; i < rooms.length; i++) {
          Room.findById(rooms[i], function(err, room){
            if (err) { 
              handleError(err); 
            }
            else if (room) {
              var roomData = {
                created_by: room.created_by,
                start_time: room.start_time,
                is_open: room.is_open,
                candidateName: room.candidateName,
                candidateEmail: room.candidateEmail,
                id: room._id,
                text: room.text[0],
                canvas: room.canvas
              }
              roomsArray.push(roomData);
            }
            else {
  // TODO: we were pushing null into array -- caused error
    // on the front end need to check first if array !null
    // Also, I think the room isn't getting deleted from the user's rooms array
              roomsArray.push({});
            }
            if (roomsArray.length === rooms.length) {
              res.send(202, roomsArray);
            }
          });
        }
      }
    } 
    else {
      res.send(304, 'User not found!');
    }
  });
}


// this one is req.BODY.id because we are using a delete request (so not sending a body)
module.exports.remove = function(req, res) {
  var roomId = req.params.id;
  var githubId = req.user;
  Room.findOneAndRemove({_id: roomId}, function(err, room) {
    if (err) { 
      handleError(err); 
      res.send(404, 'room not found');
    }
    // If a room could be found, find the user and remove that room from their list
    else if (room) {
      User.findOne({github_id: githubId}, function(err, user){
        if (err) { 
          handleError(err); 
          res.send(404, 'user not found');
        }
        else if (user) {
          var rooms = user.rooms;

          // Find the room to remove and remove it
          for (var i = 0; i < rooms.length; i++) {
            if (rooms[i] === roomId) {
              rooms.splice(i, 1);
              user.rooms = rooms;
            }
          }

          // Save the new list and send response
          user.save().then(function(){
            res.send(200, room);
          });
        }
      });
    }
  });
};

module.exports.fetchCompleted = function(req, res) {
  var githubId = req.user;
  var roomsArray = [];
  User.findOne({github_id: githubId, }, 'rooms', function(err, user){
    if (err) { 
      handleError(err); 
      res.send(200, 'cannot find user by ID');
    }
    else if(user) {
      var rooms = user.rooms;

      // If the user's room list is empty, send back the empty array
      if(rooms.length === 0){
        res.send(202, roomsArray);
      }
      // If the user has rooms, send back data about each
      else {
        for (var i = 0; i < rooms.length; i++) {
          Room.findById(rooms[i], function(err, room){
            if (err) { 
              handleError(err); 
            }
            else if (room) {
              var roomData = {
                created_by: room.created_by,
                start_time: room.start_time,
                is_open: room.is_open,
                candidateName: room.candidateName,
                candidateEmail: room.candidateEmail,
                id: room._id,
                text: room.text[0],
                canvas: room.canvas
              }
              roomsArray.push(roomData);
            }
            else {
  // TODO: we were pushing null into array -- caused error
    // on the front end need to check first if array !null
    // Also, I think the room isn't getting deleted from the user's rooms array
              roomsArray.push({});
            }
            if (roomsArray.length === rooms.length) {
              res.send(202, roomsArray);
            }
          });
        }
      }
    } 
    else {
      res.send(304, 'User not found!');
    }
  });



