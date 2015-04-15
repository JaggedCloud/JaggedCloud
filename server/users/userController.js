var Room = require('../db/models/roomModel');
var User = require('../db/models/userModel');

var handleError = function(error) {
  console.log('the following error has occurred: ' + error);
};


// For the profile page -- fetch one user to display all of their past interviews
module.exports.fetchOne = function(req, res){
  var githubId = req.user;
  User.findOne({'githubId': githubId}, function(err, user){
    if (err) {
      handleError(err);
      res.send(404, 'user not found');
    }
    else if (user) {
      var profilePhoto = user.profile_photo;
      var userName = user.name;
      var userEmail = user.email;
      var rooms = user.rooms;
      var closedRooms = [];
      for (var i = 0; i < rooms.length; i++) {
        var roomID = rooms[i]
        Room.findById(roomID, function(err, room){
          if (err) {
            handleError(err);
            res.send(404, 'room not found');
          }
          else if (room) {
            // TODO: set isOpen variable
            if (!room.isOpen) {
              closedRooms.push(room[i]);
            }
          }
          else {
            closedRooms.push(null);
          }
        });
      }
      var userData = {
        closedRooms: closedRooms,
        photo: profilePhoto,
        name: userName,
        email: userEmail
      }
      res.send(200, userData);
    }
  });
}




// below function can replace current auth query
module.exports.findOrCreateUser = function(req, res) {
  User.findOne({'githubId': githubID}, function(err, user){
    if (err) {
      User.create({'githubId': githubId}, function(err, user) {
        if (err) {
          handleError(err);
          res.send(404, 'user not found');
        }
        else {
          console.log('user: ', user);
          res.send(201, user);
        }
      });
    }
    else {
      console.log('user: ', user);
      res.send(201, user);
    }
  });
}



