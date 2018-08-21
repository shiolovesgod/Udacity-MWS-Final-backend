/**
 * AuthController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  register: function (req, res, proceed) {

    if (req.method != 'POST') res.send(`Method Requested: ${req.method}`);

    //this code is hard to follow, I may turn this into a helper function
    createLocalUser(req.body, (dbRes) => { //callback for when done...uses closure

      switch (dbRes.body) {
        case 200:
          res.ok(dbRes.body); //return new user

          //!!!!!!!!set the session code

          break;
        default:
          res.serverError(dbRes.body);
      }

    });

  },

  local: function (req, res, proceed) {

    if (req.method != 'POST') res.send(`Method Requested: ${req.method}`);

    validateLocalUser(req.body, (validRes) => {

      switch (validRes.code) {
        case 200: // all ok
          res.ok(validRes.body); //send user

          //!!!!!!!!set the session code

          break;
        case 401: //bad password
          res.forbidden(validRes.body);
          break;
        case 404: //user not found
          res.notFound(validRes.body);
          break;
      }
    });


  },

  google: function (req, res, proceed) {
    if (req.method != 'POST') res.send(`Method Requested: ${req.method}`);

    const idtoken = req.body.idtoken;

    processGoogleToken(idtoken, function (dbRes) {

      switch (dbRes.code) {
        case 200:
          res.ok(dbRes.body); //return new user

          //!!!!!!!!set the session code

          break;
        case 401:
          res.forbidden(dbRes.body);
          break;
        default:
          res.serverError(dbRes.body);
      }


    })


  },

  facebook: function (req, res, proceed) {
    res.send(this);
  },

  logout: function (req, res, proceed) {
    res.send('Logout Requested');
  },


};

/*
*
Google Auth
*
*/


const {OAuth2Client} = require('google-auth-library');
const clientID = sails.config.keys.google.client;
const googleClient = new OAuth2Client(clientID);

function processGoogleToken(idToken, cb) {
  //verify the token

  verify(idToken).catch(err => {
    cb({
      code: 401,
      body: err.message
    });
    return;
  }).then(ticket => {

    if (!ticket) return //already had an error

    const payload = ticket.getPayload();

    //create or return user
    //name, email, platform, id
    if (!payload) {
      cb({
        code: 500,
        body: 'No payload returned from token'
      });
      return

    }

    createOAuthUser({
      name: payload['name'],
      email: payload['email'],
      platform: 'google',
      authid: payload['sub'],
      photo: payload['picture']
    }, cb);

    return


  })

}

async function verify(idToken) {
  const ticket = await googleClient.verifyIdToken({
    idToken: idToken,
    audience: clientID
  });

  return ticket;
}

function createOAuthUser(params, cb) {
  //Return promised user .then((err, user, wasCreated))
  User.findOrCreate({
    authid: params.authid
  }, {
    name: params.name,
    email: params.email,
    platform: params.platform,
    authid: params.authid,
    photo: params.photo,
  }).exec((err, user) => {

    if (err) {
      cb({
        code: 500,
        body: err
      });
      return;
    }

    cb({
      code: 200,
      body: user.toJSON()
    });

  });
};


/*
*
Local
*
*/


var bcrypt = require('bcrypt');

function createLocalUser(params, cb) {
  //Make sure the user doesn't exist
  retrieveUser(params.email, (user) => { //callback after user is found

    if (user) {
      cb({
        code: 400,
        body: 'User Already Exists'
      }); //throw error
      return
    } else {
      //Passwords and form fields already compared on front end
      var newUser = bcrypt.hash(params.password, 10).then(function (hashPW, err) {

        if (err) {
          cb({
            code: 500,
            body: err
          }); //hashing error
          return;
        };

        //create new record
        User.create({
          name: params.name,
          email: params.email,
          password: hashPW,
          platform: local,
          photo: undefined,
        }).exec(function (err, user) {

          if (err) {
            cb({
              code: 500,
              body: err
            }); //record creation error
            return;
          }

          cb({
            code: 200,
            body: user.toJSON()
          }); //success
        });

      });

    }
  })
};

function validateLocalUser(params, cb) {

  retrieveUser(params.email, function (user) {

    if (!user) {
      cb({
        code: 404,
        body: 'User not found'
      });
      return
    }; //user not found

    //check password 
    bcrypt.compare(params.password, user.password).then((match) => {
      if (match) {
        cb({
          code: 200,
          body: user
        });
        return
      } else {
        cb({
          code: 401,
          body: 'Incorrect password'
        });
        return;
      }
    });
  });
}




/*
*
Shared
*
*/


//Retrieve user if exists
var retrieveUser = function (email, cb) {
  User.findOne({
    email: email
  }).exec((err, user) => {
    // console.log(user);
    if (user) user = user.toJSON();
    cb(user);
  });
};