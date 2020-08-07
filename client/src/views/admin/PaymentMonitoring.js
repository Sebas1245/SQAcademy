import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import PropTypes from 'prop-types';
import Typography from '@material-ui/core/Typography';
// Components for Tabs
import RegisterStudent from '../../components/admin/RegisterStudent';
import DisplayLateStudent from '../../components/admin/DisplayLateStudents';
import AllStudentsInfo from '../../components/admin/AllStudentsInfo';
import Box  from '@material-ui/core/Box';


function TabPanel(props) {
    const { children, value, index, ...other } = props;
  
    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`scrollable-auto-tabpanel-${index}`}
        aria-labelledby={`scrollable-auto-tab-${index}`}
        {...other}
      >
        {(
          <Box p={3}>
            <Typography>{children}</Typography>
          </Box>
        )}
      </div>
    );
}

TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.any.isRequired,
    value: PropTypes.any.isRequired,
};

const useStyles = makeStyles({
    root: {
      flexGrow: 1,
    },
  });
  
export default function PaymentMonitoring() {
  const classes = useStyles();
  const [value, setValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Paper className={classes.root}>
      <Tabs
        value={value}
        onChange={handleChange}
        indicatorColor="primary"
        textColor="primary"
        centered
      >
        <Tab label="Adeudos de alumnos" />
        <Tab label="Dar de alta a un alumno" />
        <Tab label="Información por alumno" />
      </Tabs>

      <TabPanel value={value} index={0}>
        <DisplayLateStudent />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <RegisterStudent />
      </TabPanel>
      <TabPanel value={value} index={2}>
        <AllStudentsInfo />
      </TabPanel>
    </Paper>
  );
}