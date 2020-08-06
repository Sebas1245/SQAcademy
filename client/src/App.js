import React from 'react';
import SignInForm from './components/SignInForm';
import PaymentMonitoring from './views/admin/PaymentMonitoring';
import SQAcademyInfo from './views/SQAcademyInfo';
import {
  createMuiTheme,
  MuiThemeProvider
} from "@material-ui/core/styles";
import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom';
import authentication from './utils/authentication';

const theme = createMuiTheme({
  palette: {
    primary: {
      main: "#A32CC4",
      dark: "#710193",
      
    },
    secondary: {
      main: "#C44B6F",
      dark: "#BE375F"
    }
  },
  // typography: {
  //   body1: {
  //     fontFamily: "Comic Sans"
  //   }
  // },
  // custom: {
  //   myOwnComponent: {
  //     margin: "10px 10px",
  //     backgroundColor: "lightgreen"
  //   }
  // }
});

function AdminRoute({ children , ...rest }){
  return (
    <Route
      {...rest}
      render={ ({ location }) => {
        return authentication.isAuthenticated ? 
        ( children ) : 
        ( <Redirect to={{ pathname: "/login", from: location }} /> )
      }
      }    
    />
  )
}

function App() {
  return (
    <MuiThemeProvider theme={theme}>
      <Router>
        <div className="App">
          <Switch>
            <Route exact path="/" component={SQAcademyInfo} />
            <Route path="/login" component={SignInForm} />
            <AdminRoute path="/admin">
              <PaymentMonitoring />
            </AdminRoute>
          </Switch>
        </div>
      </Router>
    </MuiThemeProvider>
  );
}

export default App;
