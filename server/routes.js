module.exports = function(app) {
  app.use('/auth', require('./auth');
  app.use('/user', require('./user');
  app.use('/room'), require('./room');
};