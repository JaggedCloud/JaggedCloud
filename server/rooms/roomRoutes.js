var roomController = require('./roomController.js');

module.exports = function(router){

  router.post('/save', roomController.save);

  router.post('/create', roomController.create);

  router.get('/get:id', roomController.fetchOne);

  router.get('/home', roomController.fetchAll);

  router.delete('/remove:id', roomController.remove);

};