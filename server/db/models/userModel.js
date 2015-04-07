var db = require('../config.js');

var mongoose = require('mongoose');

// SCHEMA: each schema maps to a 'collection' in MongoDB (analogous to SQL table) and defines the shape of the 'documents' within that colletion (documents are analogous to a row in a SQL table)
var userSchema = new mongoose.Schema({
  name: {
    first: String,
    last: String
  },
  githubId: String,
  accessToken: String,
  refreshToken: String,
  email: String,
  date_created: {
    type: Date,
    default: Date.now
  },
  profile_photo: String,
  rooms: []
});



// METHODS: these need to be added to the schema before compling with mongoose.model; any methods go here:
// example from Mongoose docs:
// kittySchema.methods.speak = function () {
//   var greeting = this.name
//     ? "Meow name is " + this.name
//     : "I don't have a name"
//   console.log(greeting);
// }


// MODELS: a model is a class with which we construct documents (rows in a table)
module.exports = mongoose.model('User', userSchema);


// INSTANTIATION: example
// var garron = new User({
//   name: {
//     first: 'Garron',
//     last: 'Sanchez'
//   },
//   email: ImAlwaysHungry@food.com,
//   profile_photo: <some string for his photo>,
//   rooms: [] --> this is initially empty I guess
// });


// SAVE to database:
// garron.save(function (err, data) {
// if (err) console.log(err);
// else console.log('Saved : ', data );
// });