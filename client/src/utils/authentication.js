import axios from 'axios';

const authentication = {
    isAuthenticated: false,
    authenticate(username,password,cb) {
        axios({
            method: 'POST',
            data: {
              username,
              password
            },
            withCredentials: true,
            url: 'http://localhost:5000/login', // change url in development
        }).then((res) => {
          if(res.data.msg === 'success') {
              authentication.isAuthenticated = true;
              cb(null, authentication.isAuthenticated);
          }
        }).catch((err) => {
          // design user feedback for auth error
          console.log(err);
          cb(err);
          alert(err);
        })
    },
    signout(cb) {
      //
    }
};

export default authentication;