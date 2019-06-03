var express = require("express");
var router = express.Router();
var passport = require("passport");
var LocalStrategy = require("passport-local").Strategy;

var User = require("../models/user");

// REGISTER METHOD
router.post("/register", function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  var confirmPassword = req.body.confirmPassword;
  var avatar;
  if (!req.body.avatar || req.body.avatar != "") {
    avatar = req.body.avatar;
  } else {
    avatar =
      "https://upload.wikimedia.org/wikipedia/commons/7/70/User_icon_BLACK-01.png";
  }

  req.checkBody("username", "Username is required").notEmpty();
  req.checkBody("password", "Password is required").notEmpty();
  req
    .checkBody("confirmPassword", "Passwords must match")
    .equals(req.body.password);
  var errors = req.validationErrors();

  if (errors) {
    return res.status(500).send({ message: errors });
  } else {
    User.getUserByUsername(username, function(err, user) {
      if (err) {
        throw err;
      }
      if (user) {
        return res.status(404).send({ message: "USER NAME ALREADY EXISTS" });
      }
      if (!user) {
        var newUser = new User({
          username: username,
          password: password,
          avatar: avatar
        });

        User.createUser(newUser, function(err, user) {
          if (err) {
            throw err;
          }
        });
        return res.status(200).send({ message: "USER CREATION SUCCESS!" });
      }
    });
  }
});

// START PASSPORT MAGIC
passport.use(
  new LocalStrategy(function(username, password, done) {
    User.getUserByUsername(username, function(err, user) {
      if (err) {
        throw err;
      }
      if (!user) {
        return done(null, false, { message: "Unknown User" });
      }

      User.comparePassword(password, user.password, function(err, isMatch) {
        if (err) {
          throw err;
        }
        if (isMatch) {
          return done(null, user);
        } else {
          return done(null, false, { message: "Invalid password" });
        }
      });
    });
  })
);

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.getUserById(id, function(err, user) {
    done(err, user);
  });
});
//END PASSPORT MAGIC

router.post("/login", function(req, res, next) {
  passport.authenticate("local", function(err, user, info) {
    if (err) {
      return res.status(500).send({ message: "SERVER ERROR" });
    }
    if (!user) {
      return res.status(400).send({ message: "NO USER FOUND" });
    }
    req.logIn(user, function(err) {
      if (err) {
        return res.status(500).send({ message: "SERVER ERROR" });
      }
      return res.json(user);
    });
  })(req, res, next);
});

//LOGOUT METHOD
router.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/#/");
});

module.exports = router;
