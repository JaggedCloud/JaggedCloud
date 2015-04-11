var db = require('../config.js');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;


// SCHEMA: each schema maps to a 'collection' in MongoDB (analogous to SQL table) and defines the shape of the 'documents' within that colletion (documents are analogous to a row in a SQL table)
var userSchema = new Schema({
  
  name: {
    first: String,
    last: String
  },

  email: {
    type: String,
    unique: true
  },

  date_created: {
    type: Date,
    default: Date.now
  },

  github_id: String,
  access_token: String,
  refresh_token: String,
  profile_photo: String,
  rooms: [{ type: Schema.Types.ObjectId, ref: 'Room' }],
});


// MODELS: a model is a class with which we construct documents (rows in a table)
module.exports = mongoose.model('User', userSchema);