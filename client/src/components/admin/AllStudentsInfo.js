import React from 'react';
import axios from 'axios';
import MaterialTable from 'material-table'
import { Popover, makeStyles} from '@material-ui/core';
import TransactionTable from '../TransactionTable';
import RegisterStudentPayment from './RegisterStudentPayment';


async function getStudentTransactionList(studentId) {
    console.log(studentId);
    try {
        const res = await axios
            .get(`http://localhost:5000/admin/get_all_students/get_transactions/${studentId}`)
            if(res.data.msg === 'success') {
                return res.data.allTransactions;
            }    
    } catch(err) {
        Promise.reject(err)
    }
}

const useStyles = makeStyles((theme) => ({
    root: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: theme.palette.background.paper,
    },
}));

export default function AllStudentsInfo(){
    const classes = useStyles();
    const [open, setOpen] = React.useState(false);
    const [popUpComp, setPopUpComp] = React.useState('');
    // const [anchorEl, setAnchorEl] = React.useState(null);
    const [state, setState] = React.useState({
        columns: [
            { title: 'Nombre completo', field: 'name', },
            { title: 'Teléfono', field: 'phone', },
            { title: 'Email', field: 'email', },
            { title: 'Grupo', field: 'group', },
            { title: 'Adeudo total', field: 'balance', },
            { title: 'Ciclo de pago', field: 'cycle', },
            { title: 'Último pago', field: 'lastPaymentMade', },
            

        ],
        data: [],
    })
    React.useEffect(() => {
        axios
        .get("http://localhost:5000/admin/get_all_students")
        .then((res) => {
            if(res.data.msg === 'success') {
                setState({
                    ...state,
                    data: res.data.allStudents
                })
            }
        })
        .catch((err) => {
            alert(err);
        })
        
    }, [])

    const handleClose = () => {
        setOpen(false);
    }

    return(
        <div>
            <MaterialTable
            title="Todos los alumnos"
            columns={state.columns}
            data={state.data}
            actions={[
                {
                    icon: 'info',
                    tooltip: 'Ver historial de pago',
                    onClick: async (event, rowData) => {
                        const transactions = await getStudentTransactionList(rowData._id);
                        console.log(transactions);
                        setPopUpComp(<TransactionTable transactions={transactions} />)
                        setOpen(true);
                    }
                },
                {
                    icon: 'payments',
                    tooltip: 'Registrar un pago para el alumno',
                    onClick: (event, rowData) => {
                        setPopUpComp(<RegisterStudentPayment studentId={rowData._id} studentName={rowData.name} />)
                        setOpen(true)
                    }
                }
            ]}
            />
            <Popover
                open={open}
                onClose={handleClose}
                anchorReference="anchorPosition"
                anchorPosition={{ top: 200, left: 400 }}
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
            >
                {popUpComp}
            </Popover>
        </div>
    )
}
