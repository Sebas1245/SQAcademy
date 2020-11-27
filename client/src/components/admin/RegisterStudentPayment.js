import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import Snackbar from '@material-ui/core/Snackbar';
import Alert from '@material-ui/lab/Alert';
import {
    MuiPickersUtilsProvider,
    KeyboardDatePicker,
  } from '@material-ui/pickers';
import DateFnsUtils from '@date-io/moment';
import axios from 'axios';


const useStyles = makeStyles((theme) => ({
    paper: {
        padding: theme.spacing(3),
        color: theme.palette.text.secondary,

    },
    root: {
        flexGrow: 1,
    },
    formControl: {
        marginTop: theme.spacing(2),
        marginBottom: theme.spacing(2),
        minWidth: '100%',
    },
    form: {
        minWidth: 700,
        width: '100%', // Fix IE 11 issue.
        marginRight: theme.spacing(2)
    },
    inputs: {
        marginTop: theme.spacing(2),
        marginBottom: theme.spacing(2),
        minWidth: '100%'
    },
  }));

export default function RegisterStudentPayment ({studentId, studentName}) {
    const classes = useStyles();
    const [state, setState] = React.useState({
        amount: 0,
        kind: '',
        errorMsg: '',
        successMsg: ''
    })
    const [paymentDate, setPaymentDate] = React.useState(new Date());
    const [openErrMsg, setOpenErrMsg] = React.useState(false);
    const [openSuccMsg, setOpenSuccMsg] = React.useState(false);

    const handleChange = (event) => {
        setState({
            ...state,
            [event.target.name]: event.target.value
        });
    };

    const handlePaymentDateChange = (date) => {
        setPaymentDate(date);
    };
    const handleErrClose = () => {
        setOpenErrMsg(false);
    }

    const handleSuccClose = () => {
        setOpenSuccMsg(false);
    }
    const handleSubmit = (e) => {
        e.preventDefault();
        //validate inputs
        if(state.amount === 0 || state.kind === '') {
            setState({
                ...state,
                errorMsg: 'Debe llenar todos los campos obligatorios.'
            })
            setOpenErrMsg(true);
        }
        else{
            axios
            .post("https://sq-academy.herokuapp.com/admin/register_student_payment",
            {
                refersTo: studentId,
                amount: state.amount,
                date: paymentDate,
                identifier: state.kind
            })
            .then((res) => {
                console.log(res);
                console.log(res.data.msg)
                if(res.data.msg === 'success') {
                    setOpenErrMsg(false);
                    setPaymentDate(new Date());
                    setState({
                        ...state,
                        amount: 0,
                        kind: '',
                        errorMsg: '',
                        successMsg: 'Se registró el pago exitosamente.'
                    })
                    document.getElementById('register-student-payment-form').reset();
                    setOpenSuccMsg(true);
                    setTimeout(window.location.reload(false), 3200);
                }
            })
            .catch((err) => {
                console.log('err', err)
                setState({
                    ...state,
                    errorMsg: 'Error interno al registrar el pago. '
                })
                setOpenErrMsg(true);
            })
        }
    }
    return (
        <div>
            <form id="register-student-payment-form" className={classes.form} noValidate autoComplete="off" onSubmit={handleSubmit}>
            <Grid className={classes.paper} spacing={3}>
                <Grid xs={12}>
                    <Typography variant="h3">Registrar pago para {studentName} </Typography>
                </Grid>
                <Grid xs={12}>
                    <TextField className={classes.inputs} label="Monto" name="amount" type="number" onChange={handleChange} />
                </Grid>
                <Grid xs={12}>
                    <MuiPickersUtilsProvider utils={DateFnsUtils}>
                    <KeyboardDatePicker
                        disableToolbar
                        fullWidth
                        variant="inline"
                        format="DD/MM/yyyy"
                        margin="normal"
                        name="paymentDate"
                        id="date-picker-inline"
                        label="Fecha del pago"
                        value={paymentDate}
                        onChange={handlePaymentDateChange}
                        KeyboardButtonProps = {{
                            'aria-label': 'change date',
                        }}
                        />
                    </MuiPickersUtilsProvider>
                </Grid>
                <Grid xs={12} >
                    <InputLabel htmlFor="payment-kind">¿A qué se está abonando?</InputLabel>
                    <FormControl className={classes.formControl}>
                        <Select
                            name="kind"
                            labelid="payment-kind-label"
                            value={state.kind}
                            onChange={handleChange}
                        >
                        <MenuItem value={"ClassPayment"}>Clase</MenuItem>
                        <MenuItem value={"Additional"}>Adicional</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid container alignItems="center" justify="center" direction="column" spacing={0} item xs={12}>
                    <Button
                        type="submit"
                        size="large"
                        variant="outlined"
                        color="secondary"
                    >
                        Registrar
                    </Button>
                </Grid>
            </Grid>
            </form>
            <Snackbar open={openErrMsg} autoHideDuration={6000} onClose={handleErrClose}>
                <Alert elevation={6} variant="filled" onClose={handleErrClose} severity="error">
                    {state.errorMsg}
                </Alert>
            </Snackbar>
            <Snackbar open={openSuccMsg} autoHideDuration={6000} onClose={handleSuccClose}>
                <Alert elevation={6} variant="filled" onClose={handleSuccClose} severity="success">
                    {state.successMsg}
                </Alert>
            </Snackbar>
        </div>
    )
}