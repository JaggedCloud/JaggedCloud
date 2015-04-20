var Room = require('../db/models/roomModel');
var User = require('../db/models/userModel');
var mandrill = require('../email/message');

var handleError = function(error) {
  console.error('The following error has occurred: ' + error);
};


// MAYBE: refactor fetchAll with async library


/**
 * userHasAccess:
 * This function takes in room and githubId; determinues if user has access
 */
var userHasAccess = function(room, githubId) {
  var currentTime = Date.now();

  if (userIsCreator(room, githubId)) {
    return true;
  }
  if (currentTime >= room.start_time && currentTime < room.end_time) {
    return true;
  }
  return false;
};

/**
 * userIsCreator:
 * This function takes in room and githubId; determinues if user is the creator
 */

var userIsCreator = function(room, githubId) {
  return room.created_by === githubId;
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

  // find room and update data
  Room.findOneAndUpdate({_id: roomId}, {canvas: canvas, text: text, start_time: startTime, end_time: endTime}, {upsert: true},
    function(err, room){
      // error finding room
      if (err) {
        handleError(err);
        res.status(404).send('error finding room');
      }
      else {
        // no room found
        // should this logic be reversed? only send back the 200 if a room is found
        if (!room){
          res.status(404).send('no room found');
        }
        else {
          // room found, data saved, room object sent back
          res.status(201).send(room);      
        }
      }
    }
  );
};


/**
 * RoomController.access:
 * This function determines whether a user can access a room or not and returns a boolean
 */
module.exports.access = function(req, res) {
  var roomId = req.params.id;
  var githubId = req.user;

  if (roomId.match(/^[0-9a-fA-F]{24}$/)) {
    Room.findById(roomId, function(err, room) {
      if(err) {
      // if an error occurs console the error
        handleError(err);
      }
      if(room) {
      // if a room is found;
        console.log('Found room', room._id);
        var access = userHasAccess(room, githubId);
        res.status(200).send({access: access});
      } else {
      // if there is no room, a room does not exist, return false;
        console.log('Room', room_id, 'was not found');
        res.status(200).send({access: false});
      }
    });
  }
  else {
  // the room's id is not a valid ObjectID
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
    if(err) { 
    // error finding room
      handleError(err);
      res.status(404).send('error finding room');
    }
    if(room) {
      // room found; determine if user has access
      if(userHasAccess(room, githubId)) {
        if(userIsCreator(room, githubId)) {
          // user is creator; add creator: true property to room
          room.creator = true;
          console.log(room);
        }
        res.status(200).send(room);
      } else {
          res.status(404).send('user currently does not have room access');
        }
    } else {
      // no room found
        res.status(404).send('no room found');
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
              res.send(404, 'user not found');
            }
            // user found
            else{
              // find index of roomId in the rooms array and remove it
              var idx = user.rooms.indexOf(roomId);
              if (idx !== -1) {
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
