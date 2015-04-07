var passport = require('./githubConfig.js');

module.exports.signin = passport.authenticate('github');  

module.exports.callback = passport.authenticate('github', { failureRedirect: '/signin', successRedirect: '/' });

module.exports.logout = function(req, res) {
    req.logout();
    console.log('Logging out')
    res.redirect('/');
}

module.exports.isAuthenticated = function(req, res) {
  res.send(req.isAuthenticated() ? req.user : false);
}