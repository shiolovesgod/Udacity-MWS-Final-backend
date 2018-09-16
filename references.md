# References 

This document is to provide references for the final project of Udacity MWS Web Development Program.


This project was built on the sails framework.  Code snippets and documentation from various sources were used.


### Functionality Concepts

* Modal popup adapted from
  * Udacity's taught approach
  * WAI reference
* **Review Form** functionality adapted from:
  * https://www.w3.org/WAI/tutorials/forms/custom-controls/

### Styling Ideas

* **Notification Shadows**
  * https://codepen.io/sdthornton/pen/wBZdXq

* Google Maps


### Backend Framwework

* SailsJS

### Building tools

* Gulp 
  * `gulp-sass`
  * `gulp-concat`
  * `gulp-uglify`
  * `gulp-uglifycs`
  * `gulp-dest`
  * `gulp-sourcemaps`
* Automated reoloading: `browser-sync`
* Grunt
  * Image resizing
* CSS `sass/scss`
* Fonts:
  * Font Awesome
  * Google Fonts
* HTML Templates
  * `Nunjucks` was used to split my HTML into components

### Third party libraries

* Indexed DB with promises: `idb` (thanks Jake)
* Time manipulation: `moment.js`
* Lazy Loading: `lozad`
* picturefill

### Additional Concepts 

* Traces of several other components still in development may be seen in the project. I removed as much as I could (without breaking it). 

* These components include
  * SSL
    * I built a CA for using https on localhost
    * It was implemented on the backend with Sails
  * OAuth from Google & FB 
