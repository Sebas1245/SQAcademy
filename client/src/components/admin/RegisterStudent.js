import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import Typography from '@material-ui/core/Typography';
import MenuItem from '@material-ui/core/MenuItem';
import Button from '@material-ui/core/Button';
import Snackbar from '@material-ui/core/Snackbar';
import Alert from '@material-ui/lab/Alert';
import {
    MuiPickersUtilsProvider,
    KeyboardDatePicker,
  } from '@material-ui/pickers';
import DateFnsUtils from '@date-io/moment';


const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  formControl: {
    marginTop: theme.spacing(2),
    minWidth: '100%',
  },
  selectEmpty: {
    marginTop: theme.spacing(2),
  },
  form: {
    width: '100%', // Fix IE 11 issue.
    marginTop: theme.spacing(1),
  },
  inputs: {
    marginTop: theme.spacing(2),
    minWidth: '100%'
  },
  titles: {
      color: theme.palette.secondary.dark,
      fontWeight: 500
  },
}));

export default function BasicTextFields() {
    const classes = useStyles();
    const [state, setState] = React.useState({
      fullName: '',
      email: '',
      phone: '',
      group: '',
      paymentAmount: '',
      cycle: 'Weekly',
      additionalAmount: '',
      additionalAmountDescription: '',
      errorMsg: ''
    });
    const [startDate, setStartDate] = React.useState(new Date());
    const [firstPaymentDate, setFirstPaymentDate] = React.useState(null);
    const [additionalAmountDeadline, setAdditionalAmountDeadline] = React.useState(null);
    const [open, setOpen] = React.useState(false);


    const handleChange = (event) => {
    setState({
        ...state,
        [event.target.name]: event.target.value
    });
    };

    const handleStartDateChange = (date) => {
    setStartDate(date);
    console.log(startDate);
    };

    const handleFirstPaymentDateChange = (date) => {
    setFirstPaymentDate(date);
    }
    const handleAdditionalAmountDeadlineChange = (date) => {
    setAdditionalAmountDeadline(date);
    }
    const handleClose = () => {
        setOpen(false);
    }
    const handleSubmit = (e) => {
        e.preventDefault();
        if(state.fullName === '' || state.email === '' || state.phone === '' || state.group === '' || state.paymentAmount === '') {
            setState({
                ...state,
                errorMsg: 'Debe llenar todos los campos obligatorios.'
            })
            console.log(state.errorMsg);
            setOpen(true);
        }
        else{
            alert("Se puede proceder con el post");
        }
    }
    return (
        <div>
            <form className={classes.form} noValidate autoComplete="off" onSubmit={handleSubmit}>
            <Grid className={classes.root} spacing={4} container>
                <Grid item xs={12}>
                    <Typography variant="h4" className={classes.titles}>
                        Campos obligatorios
                    </Typography>
                </Grid>
                <Grid item xs={12}>
                    <TextField className={classes.inputs} name="fullName" label="Nombre completo" onChange={handleChange} required />
                </Grid>
                <Grid item xs={6}>
                    <TextField className={classes.inputs} name="email" type="email" label="Correo electrónico" onChange={handleChange} required />            
                </Grid>
                <Grid item xs={6}>
                    <TextField className={classes.inputs} name="phone" label="Teléfono" onChange={handleChange} required />
                </Grid>
                <Grid item xs={6}>
                    <TextField className={classes.inputs} name="group" label="Grupo" onChange={handleChange}  required />
                </Grid>
                <Grid item xs={6}>
                    <TextField className={classes.inputs} name="paymentAmount" type="number" label="Cantidad de pago"  onChange={handleChange} required />
                </Grid>
                <Grid item xs={6}>
                    <InputLabel htmlFor="payment-cycle-label">Ciclo de Pago</InputLabel>
                    <FormControl className={classes.formControl}>
                        <Select
                            name="cycle"
                            labelId="payment-cycle-label"
                            value={state.cycle}
                            onChange={handleChange}
                        >
                        <MenuItem value={"Weekly"}>Semanal</MenuItem>
                        <MenuItem value={"Monthly"}>Mensual</MenuItem>
                        <MenuItem value={"Quarterly"}>Trimestral</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={6}>
                    <MuiPickersUtilsProvider utils={DateFnsUtils}>
                    <InputLabel htmlFor="start-date-picker">Fecha de primera clase tomada</InputLabel>
                    <KeyboardDatePicker
                        disableToolbar
                        fullWidth
                        variant="inline"
                        format="DD/MM/yyyy"
                        margin="normal"
                        name="startDate"
                        id="date-picker-inline"
                        labelId="start-date-picker"
                        value={startDate}
                        onChange={handleStartDateChange}
                        KeyboardButtonProps = {{
                            'aria-label': 'change date',
                        }}
                        />
                    </MuiPickersUtilsProvider>
                </Grid>
                <Grid item xs={12}>
                    <Typography variant="h4" className={classes.titles}>
                        Campos opcionales
                    </Typography>
                </Grid>
                <Grid item xs={4}>
                    <MuiPickersUtilsProvider utils={DateFnsUtils}>
                    <KeyboardDatePicker
                        disableToolbar
                        fullWidth
                        variant="inline"
                        format="DD/MM/yyyy"
                        margin="normal"
                        name="firstPayment"
                        id="date-picker-inline"
                        label="Fecha de primer pago"
                        value={firstPaymentDate}
                        onChange={handleFirstPaymentDateChange}
                        KeyboardButtonProps = {{
                            'aria-label': 'change date',
                        }}
                        />
                    </MuiPickersUtilsProvider>
                </Grid>
                <Grid item xs={4}>
                    <TextField className={classes.inputs} name="additionalAmount" type="number" label="Montos adicionales"  onChange={handleChange} />
                </Grid>
                <Grid item xs={4}>
                    <MuiPickersUtilsProvider utils={DateFnsUtils}>
                    <KeyboardDatePicker
                        disableToolbar
                        fullWidth
                        variant="inline"
                        format="DD/MM/yyyy"
                        margin="normal"
                        name="additionalDeadline"
                        id="date-picker-inline"
                        label="Fecha límite para liquidar montos adicionales"
                        value={additionalAmountDeadline}
                        onChange={handleAdditionalAmountDeadlineChange}
                        KeyboardButtonProps = {{
                            'aria-label': 'change date',
                        }}
                        />
                    </MuiPickersUtilsProvider>
                </Grid>
                <Grid item xs={12}>
                    <TextField className={classes.inputs} name="additionalAmountDescription" label="Descripción de montos adicionales"  onChange={handleChange} />
                </Grid>
                <Grid container alignItems="center" justify="center" direction="column" spacing={0} item xs={12}>
                    <Button
                        type="submit"
                        size="large"
                        variant="outlined"
                        color="primary"
                    >
                        Dar de alta
                    </Button>
                </Grid>
            </Grid>
            </form>
            <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
                <Alert elevation={6} variant="filled" onClose={handleClose} severity="error">
                    {state.errorMsg}
                </Alert>
            </Snackbar>
        </div>          
    );
}