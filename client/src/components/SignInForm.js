import React, { useState, } from 'react';
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import CssBaseline from '@material-ui/core/CssBaseline';
import TextField from '@material-ui/core/TextField';
import LockOutlinedIcon from '@material-ui/icons/LockOutlined';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';
// Template taken from https://github.com/mui-org/material-ui/blob/master/docs/src/pages/getting-started/templates/sign-in/SignIn.js
import { BrowserRouter as Router, useHistory } from 'react-router-dom';
import authentication from '../utils/authentication';
const useStyles = makeStyles((theme) => ({
  paper: {
    marginTop: theme.spacing(8),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.primary.dark,
  },
  form: {
    width: '100%', // Fix IE 11 issue.
    marginTop: theme.spacing(1),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
    backgroundColor: theme.palette.primary.dark,
    color: theme.palette.common.white,
  },
}));

export default function SignIn() {
  const classes = useStyles();
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPsswd, setloginPsswd] = useState("");

  let history = useHistory();
  // let location = useLocation();
  let to = "/admin"; // this will have to change eventually depending on user
  const login = (e) => {
    e.preventDefault();
    authentication.authenticate(loginUsername,loginPsswd, (err,auth) => {
      if(err) {
        alert("Error de autenticación");
        authentication.isAuthenticated = false;
      }
      else{
        history.replace(to);
      }
    })
    
  }
  return (
    <Router>
        <Container component="main" maxWidth="xs">
          <CssBaseline />
          <div className={classes.paper}>
            <Avatar className={classes.avatar}>
              <LockOutlinedIcon />
            </Avatar>
            <Typography component="h1" variant="h5">
                Iniciar sesión
            </Typography>
            <form className={classes.form} noValidate={false} onSubmit={login} >
              <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                id="username"
                label="Usuario"
                name="username"
                autoComplete="username"
                autoFocus
                onChange = { (e) => setLoginUsername(e.target.value)}
              />
              <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                name="password"
                label="Contraseña"
                type="password"
                id="password"
                autoComplete="current-password"
                onChange = { (e) => setloginPsswd(e.target.value)}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="secondary"
                className={classes.submit}
              >
                Iniciar sesión
              </Button>
            </form>
          </div>
        </Container>
    </Router>
  );
}
