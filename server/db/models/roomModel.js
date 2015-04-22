var db = require('../config.js');
var mongoose = require('mongoose');


// SCHEMAS: each schema maps to a 'collection' in MongoDB (analogous to SQL table) and defines the shape of the 'documents' within that colletion (documents are analogous to a row in a SQL table)
var roomSchema = new mongoose.Schema({

  date_created: {
    type: Date,
    default: Date.now
  },

  start_time: Number, // number of milliseconds
  end_time: Number, // number of milliseconds
  is_completed: {
    type: Boolean,
    default: false
  },
  
  created_by: String, // githubId
  canvas: String,
  text: [String],
  candidateName: String,
  candidateEmail: String,
  creator: Boolean
});


// MODELS: a model is a class with which we construct documents (rows in a table)
module.exports = mongoose.model('Room', roomSchema);