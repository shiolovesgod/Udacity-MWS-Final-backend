/**
 * AuthController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

//NOTE: You still need to find a way to handle users trying to authenticate from different sources with same email (FB & Google)

module.exports = {
  register: function (req, res, proceed) {

    if (req.method != 'POST') res.send(`Method Requested: ${req.method}`);

    //this code is hard to follow, I may turn this into a helper function
    createLocalUser(req.body, (dbRes) => { //callback for when done...uses closure

      switch (dbRes.body) {
        case 200:
          //create new session
          req.session.userId = dbRes.body.id; 

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
          //create new session
          req.session.userId = dbRes.body.id; 

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
          //create new session
          req.session.userId = dbRes.body.id; 
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
    if (req.method != 'POST') res.send(`Method Requested: ${req.method}`);
    const idtoken = req.body.idtoken;

    processFacebookToken(idtoken, function (dbRes) {
      switch (dbRes.code) {
        case 200:
          //create new session
          req.session.userId = dbRes.body.id; 
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

  logout: function (req, res, proceed) {
    res.send('Logout Requested');
  },


};

/*
*
Facebook Auth
*
*/

function processFacebookToken(idToken, cb){

  verifyFacebookToken(idToken).then(res => {

    //If token invalid
    if (!res.data || !res.data.is_valid){
      cb({code: 401, body: 'The token is not valid'});  //not sure what comes back if it's bad
      return
    }

    //If token valid, get user info from access token
    const user_id = res.data.user_id;

    //Get name, email, platform, user_id, picture_url
    let userInfoQuery = {
      access_token: idToken,
      fields: 'id,name,email,picture.type(large){url}',
    }

    fbAPI(`/${user_id}`, userInfoQuery).then(res => {

      createOAuthUser({
        name: res.name,
        email: res.email,
        platform: 'facebook',
        authid: res.id,
        photo: res.picture.url

      }, cb);

    });

     
  }).catch(err => {
    cb({code: 500, body: err});
  });


}



//Get an access token for the app
const fbAppID = sails.config.keys.fb.id;
const fbAppSecret = sails.config.keys.fb.secret;
var reqPromise = require('request-promise');

// const appAccessToken = sails.

function verifyFacebookToken(fbToken) {
  //Use graph API to query FB
  queryString = {
    input_token: fbToken,
    access_token: `${fbAppID}|${fbAppSecret}`
  };

  //promise for verification
  return fbAPI('/debug_token', queryString);
  
}

function fbAPI(path, params, method='GET', body='') {
  //Returns promise

  return reqPromise({
    method: method,
    uri: `https://graph.facebook.com${path}`,
    qs: params,
    body: body,
    json: true,
  });

}

/*
*
Google Auth
*
*/


const {OAuth2Client} = require('google-auth-library');


function processGoogleToken(idToken, cb) {
  //verify the token

  verifyGoogleToken(idToken).catch(err => {
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

async function verifyGoogleToken(idToken) {
  const googleClientID = sails.config.keys.google.client;
  const googleClient = new OAuth2Client(googleClientID);
  const ticket = await googleClient.verifyIdToken({
    idToken: idToken,
    audience: googleClientID
  });

  return ticket;
}

function createOAuthUser(params, cb) {
  //Return promised user .then((err, user, wasCreated))
  User.findOrCreate({
    authid: params.authid //problem if you have users with the same emails authenticating with different methods
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
  //What if they exist using OAUth?
  retrieveUser(params.email, (user) => { //callback after user is found

    if (user) {
      //TO DO: Handle notification for existing user
      cb({
        code: 400, //400 --> local user exists, 401 Google User, 402 FB User
        body: 'User Already Exists' //I may need to tell them how the user exists
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