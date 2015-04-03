// SCHEMAS: each schema maps to a 'collection' in MongoDB (analogous to SQL table) and defines the shape of the 'documents' within that colletion (documents are analogous to a row in a SQL table)
var roomSchema = mongoose.Schema({
  date_created: {
    type: Date,
    default: Date.now
  },
  users: [],
  canvas_file: String,
  text_file: String
});
// NOTE: currently each room has one canvas and one text file -- may need to increase these to an array later


// METHODS: these need to be added to the schema before compling with mongoose.model; any methods go here:
// example from Mongoose docs:
// kittySchema.methods.speak = function () {
//   var greeting = this.name
//     ? "Meow name is " + this.name
//     : "I don't have a name"
//   console.log(greeting);
// }

// MODELS: a model is a class with which we construct documents (rows in a table)
module.exports = mongoose.model('Room', roomSchema);


// INSTANTIATION: example
// var partyRoom = new Room();
// notes: do I need to pass any data into the room upon instantiation?  Don't think any of the data is available upon room creation --> canvas and text files are both blank; no users; date auto-generated?

// SAVE to database:
// partyRoom.save(function (err, data) {
// if (err) console.log(err);
// else console.log('Saved : ', data );
// });