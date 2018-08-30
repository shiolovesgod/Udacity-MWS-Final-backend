
//Google Library
//https://developers.google.com/api-client-library/javascript/reference/referencedocs#googleauthsignin

const googleBtn = document.body.querySelector('.btn-google');
const serverAddress = 'https://localhost:1337';

function googleSignIn(e) {
  console.log('Trying to sign in');
  authInstance = gapi.auth2.getAuthInstance();
  authInstance.signIn().then(user =>{

    //send the user and ID token to the back end
    backendURL = `${serverAddress}/auth/google`; //use the id token to validate user on back end

    fetch(backendURL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {'Content-Type': 'application/json; charset=utf-8'},
      body: JSON.stringify({idtoken: user.getAuthResponse().id_token})
    }).catch( err => {
      //if there is an error, let the user know
      //TO DO: Save the authenticated user to the db after we sync again
      console.log(err);
    });
    
    
    console.log(`Sign-in response: ${user}`);
  }).catch(err=>{
    console.log(err);
    console.log(`Sigin in failed: ${err.error}`)
  });

}

function gapiInit() {
  googleBtn.addEventListener('click', googleSignIn);
  gapi.load('auth2', function(){
    //Initialize the api
    gapi.auth2.init({
      client_id: '685762170340-57tkpqm1mbfmqjklvkl76uq4nkelv4l5.apps.googleusercontent.com',
    });

  })
  
  console.log('Google API is ready');

}

function onSignIn(googleUser) {
  var profile = googleUser.getBasicProfile();
  console.log('ID: ' + profile.getId()); // Do not send to your backend! Use an ID token instead.
  console.log('Name: ' + profile.getName());
  console.log('Image URL: ' + profile.getImageUrl());
  console.log('Email: ' + profile.getEmail()); // This is null if the 'email' scope is not present.
}