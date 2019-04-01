module.exports = function(app, passport, db) {
// normal routes ===============================================================
  // show the home page (will also have our login links)
    app.get('/', function(req, res) {
        res.render('index.ejs');
    });
  // MAIN LOGGED IN PAGE SECTION =========================
    app.get('/main', isLoggedIn, function(req, res) {
      db.collection('words').find().toArray((err, result) => {
        if (err) return console.log(err)
        res.render('main.ejs', {
          user : req.user,
          words: result
        })
      })
    })
  // LOGOUT ==============================
    app.get('/logout', function(req, res) {
      req.logout();
      res.redirect('/');
    });
// message board routes ===============================================================
    app.post('/words', (req, res) => {
      db.collection('words').save({name: req.body.name, word: req.body.word, def: req.body.def, thumbDown:0}, (err, result) => {
        if (err) return console.log(err)
        console.log('saved to database')
        res.redirect('/main')
      })
    })
    app.put('/words', (req, res) => {
      db.collection('words')
      .findOneAndUpdate({word: req.body.word, def: req.body.def}, {
        $set: {
          thumbDown:req.body.thumbDown + 1
        }
      }, {
        sort: {_id: -1},
        upsert: true
      }, (err, result) => {
        if (err) return res.send(err)
        res.send(result)
      })
    })
// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================
    // locally --------------------------------
      // LOGIN ===============================
      // process the login form
        app.post('/login', passport.authenticate('local-login', {
            successRedirect: '/profile', // redirect to the secure profile section
            failureRedirect: '/', // redirect back to the signup page if there is an error
            failureFlash: true // allow flash messages
        }));
      // SIGNUP =================================
      // show the signup form
        app.get('/signup', function(req, res) {
            res.render('signup.ejs', { message: req.flash('signupMessage') });
        });
      // process the signup form
        app.post('/signup', passport.authenticate('local-signup', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));
// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future
    // local -----------------------------------
    app.get('/unlink/local', isLoggedIn, function(req, res) {
        var user            = req.user;
        user.local.email    = undefined;
        user.local.password = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

};
// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}
