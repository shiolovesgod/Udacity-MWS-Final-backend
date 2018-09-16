/**
 * ReviewsController
 *
 * @description :: Server-side logic for managing reviews
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  'postReview': function (req, res, proceed) {

    //Set CORS header
    

    //Validate user inputs
    createNewReview(req.body, (dbRes)=> {

      //THIS IS NOT BEING SET ON REDIRECT
      res.set('Access-Control-Allow-Origin', sails.config.cors.origin);
      res.set('Access-Control-Expose-Headers', 'Access-Control-Allow-Origin')
      res.header('Access-Control-Allow-Origin', sails.config.cors.origin);

      switch(dbRes.code) {
        case 200:
        if(req.headers.referer || true) { //diable redirect for now

          //SAILS REDIRECT with set headers is broken!
          // res.redirect(301,`${req.headers.referer}#rNo${dbRes.body.id}`);
          res.ok(dbRes.body);
        } else {
          res.ok(dbRes.body);
        }
        
        
        //should be redirecting
        break;

        default:
          res.serverError(dbRes.body);
      }

    });

    //Send a redirect if successful
    
  },

};

function createNewReview(userData, cb) {
  //Validate Inputs
  validateReviewFields(userData, (err, validData, rest) => {
    if (err) {
      cb(err)
      return;
    };

    //THEN, add new review
    addReview(validData, cb);

    //UPDATE counts based on review
    let starCount = parseInt(rest.total_stars) || 0;
    let reviewCount = parseInt(rest.total_reviews) || 0;
    Restaurants.update({id: rest.id}, 
      {
        total_stars: starCount + validData.rating,
        total_reviews: reviewCount +1,
    }).exec((err, updated) => { 
      if (err) return; //don't worry about it for now
      console.log(`New Counts for ${updated[0].name}: ${updated[0].total_stars} stars in ${updated[0].total_reviews} reviews`);
    });

  }) 

}


function addReview(validData, cb) {
  Reviews.create({

    restaurant_id: validData.restaurant_id,
    name: validData.name,
    rating: validData.rating,
    comments: validData.comments,
  }).exec(function (err, review) {
    if(err) {
      cb({code: 500, body: err});
      return //return errror
    } 
    
    cb({code: 200, body: review});
  })
}


function validateReviewFields(formData, cb) {
  //restaurant: Make Sure it exists
  validateRestaurantId(formData.restaurant_id, (rest) => {

    //THEN...validate the rest of the inputs


    //rating (number, one to five) {force to whole number}
    let rating = Math.round(parseFloat(formData.rating));
    let isRatingValid = rating && rating < 6 && rating > 0;

    //name
    let isNameValid = Boolean(String(formData.name));

    let nInvalid = 0;
    let invalidFields = {};
    let newFormData = formData;

    if (!rest) {
      invalidFields.restaurant = "Whoops, we don't have that restaurant on our list.";
      nInvalid++;
    }


      if (!isRatingValid) {
        invalidFields.rating = "Please enter a rating between 1 & 5.";
        nInvalid++;
      }

      if (!isNameValid) {
        invalidFields.name = "Please enter your name before submitting a review.";
        nInvalid++;
      }

      if (!rest || !isRatingValid || !isNameValid) {
        invalidFields.count = nInvalid;
        cb({
          code: 500,
          body: invalidFields
        }, undefined);
        return
      }

      //Correct formats of text & escape text inputs
      newFormData.restaurant_id = rest.id; 
      newFormData.name = String(formData.name);
      newFormData.rating = rating;
      newFormData.comments = String(formData.comments);
      
      // Run the callback
      cb(undefined, newFormData, rest);

  });

}

async function validateRestaurantId(rest_id, cb) {
  let query = Restaurants.findOne({ id: rest_id })
  return await query.exec((err, rest) => {
    if (!rest || err){
      cb(false);
    } else {
      cb(rest);
    }
  })
}
