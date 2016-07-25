var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');

// JSON web token dependencies, including a secret key to sign the token
var expressJWT = require('express-jwt');
var jwt = require('jsonwebtoken');
var secret = process.env.JWT_SECRET;

var app = express();

// mongoose models and connection
var mongoose = require('mongoose');
var User = require('./models/user');
mongoose.connect('mongodb://localhost/recipes');

// decode POST data in JSON and URL encoded formats
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/recipes', require('./controllers/recipes'));
app.use('/api/users', require('./controllers/users'));

// Replace the above routes with the following
// app.use('/api/recipes', expressJWT({secret: secret}));
// app.use('/api/users', expressJWT({secret: secret})
// .unless({path: ['/api/users'], method: 'post'}));

// this middleware will check if expressJWT did not authorize the user, and return a message
app.use(function (err, req, res, next) {
  if (err.name === 'UnauthorizedError') {
    res.status(401).send({message: 'You need an authorization token to view this information.'});
  }
});

// POST /api/auth - if authenticated, return a signed JWT
app.post('/api/auth', function(req, res) {
  User.findOne({email: req.body.email}, function(err, user) {
    // return 401 if error or no user
    if (err || !user) return res.status(401).send({message: 'User not found'});

    // attempt to authenticate a user
    user.authenticated(req.body.password, function(err, result) {
      // return 401 if invalid password or error
      if (err || !result) return res.status(401).send({message: 'User not authenticated'});

      // sign the JWT with the user payload and secret, then return
      var token = jwt.sign(user, secret);
      res.send({user: user, token: token});
    });
  });
});

app.get('/*', function(req, res) {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(process.env.PORT || 3000);
