import React from 'react';
import SignInForm from './components/SignInForm';
import {
  createMuiTheme,
  MuiThemeProvider
} from "@material-ui/core/styles";

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

function App() {
  return (
    <MuiThemeProvider theme={theme}>
      <div className="App">
        <SignInForm />
      </div>
    </MuiThemeProvider>
  );
}

export default App;
