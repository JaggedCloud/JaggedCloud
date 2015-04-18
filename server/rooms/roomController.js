var Room = require('../db/models/roomModel');
var User = require('../db/models/userModel');
var mandrill = require('../email/message');

var handleError = function(error) {
  console.error('the following error has occurred: ' + error);
};


// MAYBE: refactor fetchAll with async library
// MAYBE: refactor all queries to use helper functions


/**
 * roomState:
 * This function takes in start and end times; returns current room state
 */
var roomState = function(startTime, endTime) {
  // set the currentTime equal to the current time in ms
  var currentTime = Date.now();

  // if the startTime is greater than the currentTime, the interview has not begun
  if (currentTime < startTime){
   return 'preInterview';
  }

  // if the currentTime is between the endTime and the startTime, the interview is live
  else if (currentTime >= startTime && currentTime < endTime){
   return 'live';
  }

  // if the currentTime is greater than the endTime, the interview is over
  else if (currentTime >= endTime){
   return 'complete';
  }

  // if none of the states apply, we've hit an error
  else {
   console.error('error processing room state');
  }
};

/**
 * RoomController.create:
 * This function creates a new interview room
 */
module.exports.create = function(req, res) {
  var startTime = Date.parse(req.body.time);
  var endTime = startTime + 86400000; // create the default end time of 24hrs (86400000ms) later than the start time
  var githubId = req.user;
  var sendEmail = req.body.sendEmail;
  var email = req.body.email;
  var name = req.body.name;
  var isOpen = Date.now() >= startTime;

  // create new interview room
  Room.create({ created_by: githubId, candidateName: name, candidateEmail: email, start_time: startTime, end_time: endTime }, function(err, room){
    // error creating room
    if (err) {
      handleError(err);
      res.status(404).send('error creating room');
    }
    else{
      // no room created
      if (!room) {
        handleError(err);
        res.status(404).send('error creating room');
      }
      // room created successfully
      else {
        console.log('room successfully created!');

        // find user and push room to user's rooms array
        User.findOneAndUpdate({github_id: githubId}, {$push: {rooms: room._id}}, function(err, user){
          // error finding user
          if (err) {
            handleError(err);
            res.status(404).send('error finding user');
          }
          else {
            // user doesn't exist
            if (!user) {
              handleError(err);
              res.status(201).send(room);
            }
            // user exists; send email to candidate and send room object back
            else {
              console.log('successfully added new room to user!' + user);
              if (sendEmail) {
                mandrill.sendMessage({email:email, fullname: name});
              }
              res.status(201).send(room);
            }
          }
        });
      }      
    }
  });
};

/**
 * RoomController.save:
 * This function saves the data in the interview room
 */
module.exports.save = function(req, res) {
  var roomId = req.body.roomId;
  var canvas = req.body.canvas;
  var text = req.body.textEditor;
  var startTime = req.body.startTime;
  var endTime = req.body.endTime;

  // if the time is invalid, simply end the function and return
  if(roomState(startTime, endTime) === 'complete') {
    res.status(501).send('The room state is invalid for saving');
    return;
  }
  // find room and update data
  Room.findOneAndUpdate({_id: roomId}, {canvas: canvas, text: text, notes: notes, start_time: startTime, end_time: endTime}, {upsert: true},
    function(err, room){
      // error finding room
      if (err) {
        handleError(err);
        res.status(404).send('error finding room');
      }
      else {
        // no room found
        if (!room){
          handleError(err);
          res.status(404).send('no room found');
        }
        else {
          // room found, data saved, room object sent back
          handleError(err);
          res.status(201).send(room);      
        }
      }
    }
  );
};

/**
 * RoomController.exists:
 * This function determines if the room exists
 */
module.exports.exists = function(req, res) {
  var roomId = req.params.id;
  
  if (roomId.match(/^[0-9a-fA-F]{24}$/)) {
    // Yes, it's a valid ObjectId, proceed with `findById` call.
    Room.findById(roomId, function(err, room) {
      // if an error occurs console the error
      if(err) {
        console.error('Error: ', err);
      }
      // if a room exists, return true;
      if(room) {
        console.log('Found room: ', room._id);
        res.status(200).send({exists: true});
      // if  a room does not exist, return false;
      } else {
        console.log('No room, instead found: ', room);
        res.status(200).send({exists: false});
      }
    });
  }
  else {
    res.status(200).send({exists: false});
  }
};

/**
 * RoomController.access:
 * This function determines whether a user can access a room or not and returns a boolean
 */
module.exports.access = function(req, res) {
  var roomId = req.params.id;

  if (roomId.match(/^[0-9a-fA-F]{24}$/)) {
    Room.findById(roomId, function(err, room) {
      // if an error occurs console the error
      if(err) {
        console.error('Error:', err);
      }
      // if a room is found;
      if(room) {
        console.log('Found room', room._id);
        // if the user requesting the room is the room's creator or the room is live, access is true
        if(room.created_by = req.user || roomState(room.start_time, room.end_time) === 'live') {
          console.log('Room', room._id, 'is accessible');
          res.status(200).send({access: true});
        // if the user requesting the room is not the room's creator and the room is not live, access is false  
        } else {
          console.log('Room', room._id, 'is not accessible')
          res.status(200).send({access: false});
        }
      // if  a room does not exist, return false;
      } else {
        console.log('Room', room_id, 'was not found');
        res.status(200).send({access: false});
      }
    });
  }
  else {
    res.status(200).send({access: false});
  }
}

/**
 * RoomController.fetchOne:
 * This function retrieves the data from one specific room
 */
module.exports.fetchOne = function(req, res) {
  // retrieve roomdId using req.PARAMS.id because this is a get request (so a body is not sent)
  var roomId = req.params.id;
  var githubId = req.user;

  // find room by githubId
  Room.findById(roomId, function(err, room){
    // error finding room
    if(err) { 
      handleError(err);
      res.status(404).send('error finding room');
    }
    else {
      // no room found
      if(!room) {
        handleError(err);
        res.status(404).send('no room found');
      }
      else {
        // room found; determine roomState
        var startTime = room.start_time;
        var endTime = room.end_time;
        var currentState = roomState(startTime, endTime);
        // if room is preInterview and creator is trying to access it, send room
        if (currentState === 'preInterview') {
          if (githubId === room.created_by) {
            console.log('creator accessing room early');
            res.status(200).send(room);
          }
          // if room is preInterview and non-creator is trying to access it, send error
          else {
            console.log('user trying to access room early');
            res.status(404).send('room not yet available');
          }
        }
        // if room is live, send room (doesn't matter if creator or candidate)
        else if (currentState === 'live') {
          res.status(200).send(room);
        }
        // if room is complete and creator is trying to access it, send room
        else if (currentState === 'complete') {
          if (githubId === room.created_by) {
            console.log('creator accessing room after completion');
            res.status(200).send(room);
          }
          // if room is complete and non-creator is trying to access it, send error
          else {
            console.log('user trying to access room after completion');
            res.status(404).send('room no longer available');
          }
        }
        else {
          res.status(404).send('room is not in an expected state');
        }
        // var isOpen = (Date.now() > Date.parse(room.start_time)) || githubId === room.created_by;
        // console.log('is the room open', isOpen)
        //  res.status(200).send(room);
        // if(isOpen) {
        // }
      }
    }
  });
};

/**
 * RoomController.fetchAll:
 * This function retrieves all of the user's rooms
 */
module.exports.fetchAll = function(req, res) {
  var githubId = req.user;
  // find user by their githubId
  User.findOne({github_id: githubId}, function(err, user){
    // error fetching user
    if (err) { 
      handleError(err); 
      res.status(400).send('cannot find user by ID');
    }
    // no retrieval error
    else {
      // no user
      if (!user) {
        handleError(err);
        res.status(404).send('no user found');
      }
      // user found
      else {
        // user's array of rooms; empty array to be populated and sent back
        var rooms = user.rooms;
        var roomsArray = [];

        // if the user's room array is empty or undefined, send back the empty array
        if (rooms.length === 0){
          res.status(202).send(roomsArray);
        }
        // if the user has rooms in their rooms array, iterate through each one
        else {
          for (var i = 0; i < rooms.length; i++) {
            // retrieve each room in the array by id
            Room.findById(rooms[i], function(err, room){
              // error fetching room
              if (err) { 
                handleError(err); 
                res.status(404).send('error fetching room');
              }
              // no error fetching room
              else {
                // room not found; push empty object into array
                if (!room) {
                  console.log('room not found');
                  roomsArray.push({});
                }
                // room found; add requested info to roomData object
                else {
                  var roomData = {
                    created_by: room.created_by,
                    start_time: room.start_time,
                    candidateName: room.candidateName,
                    candidateEmail: room.candidateEmail,
                    id: room._id,
                    text: room.text[0],
                    canvas: room.canvas
                  }
                  // push roomData back into roomsArray
                  roomsArray.push(roomData);
                }
              }
              // once the roomsArray is equal in length to the user's array of rooms, send back data
              if (roomsArray.length === rooms.length) {
                res.status(202).send(roomsArray);
              }
            });
          }
        }
      }
    }
  });
};

/**
 * RoomController.remove:
 * This function deletes a room and also removes it from the user's rooms array
 */
module.exports.remove = function(req, res) {
  // req.PARAMS.id required because we are using a delete request (so not sending a body)
  var roomId = req.params.id;
  var githubId = req.user;
  // find room by id
  Room.findOneAndRemove({_id: roomId}, function(err, room) {
    // error fetching room
    if (err) { 
      handleError(err); 
      res.status(404).send('error fetching room');
    }
    // no error finding room
    else {
      // room not found
      if (!room) {
        handleError(err); 
        res.status(404).send('room not found');
      }
      // room was found
      else {
        // find user by their githubId
        User.findOne({github_id: githubId}, function(err, user){
          // error finding user
          if (err) { 
            handleError(err); 
            res.send(404, 'error finding user');
          }
          // no error finding user
          else {
            // user not found
            if (!user) {
              handleError(err); 
              res.send(404, 'user not found');
            }
            // user found
            else{
              // find index of roomId in the rooms array and remove it
              var idx = user.rooms.indexOf(roomId);
              if (idx) {
                user.rooms.splice(idx, 1);
              }
              // save user with new array and send back room
              user.save().then(function(){
                res.send(200, room);
              });
            }
          }
        });
      }
    }
  });
};
