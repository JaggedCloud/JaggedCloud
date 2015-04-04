// INITIATION: add mongoose to project and open connection to database on locally running MongoDB instance 
var mongoose = require('mongoose');
var mongoURI = 'mongodb://localhost/hackbox';
var db = mongoose.connection;


// CONNECTION: pending to database on local host; need notification if connected successfully or error occured
mongoose.connect(mongoURI);

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function(callback){
  console.log('MongoDB connection open!');
});

// export db and require it in the server