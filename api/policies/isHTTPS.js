//http://www.procoefficient.com/blog/implementing-https-in-sailsjs-the-right-way/

module.exports = function(req, res, next) {
  if (req.secure) {
      // Already https; don't do anything special.
      next();
  } else {
      // Redirect to https.
      res.redirect('https://' + req.headers.host + req.url);
  }
};