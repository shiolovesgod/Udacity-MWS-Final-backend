/**
 * Reviews.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {

    rating: {
      type: 'number',
      min: 1,
      max: 5,
      required: true,
    },

    restaurant_id: {
      required: true,
      type: 'number',
      custom: async function(value) {

        return true;
        //make sure this restaurant exists
       let query =  Restaurants.findOne({
          id: this.restaurant_id,
        })

        return await query.exec((err, rest) => {
          if (rest) return true;

          return false;

        });
      }
    }

  }
};
