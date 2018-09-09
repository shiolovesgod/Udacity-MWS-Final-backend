/**
 * ReviewsController
 *
 * @description :: Server-side logic for managing reviews
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  'postReview': function (req, res, proceed) {

    //Validate user inputs
    createNewReview(req.body, (dbRes)=> {

      switch(dbRes.code) {
        case 200:
        res.ok(dbRes.body);
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
  validateReviewFields(userData, (err, validData) => {
    if (err) {
      cb(err)
      return;
    };

    //THEN, add new review
    addReview(validData, cb);

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
    let isNameValid = Boolean(escape(formData.name));

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
      newFormData.name = escape(formData.name);
      newFormData.rating = rating;
      newFormData.comments = escape(formData.comments);
      
      // Run the callback
      cb(undefined, newFormData);

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
