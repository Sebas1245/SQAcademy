import React from 'react';
import axios from 'axios';
import MaterialTable from 'material-table'
import { Popover } from '@material-ui/core';
import TransactionTable from '../TransactionTable';
import RegisterStudentPayment from './RegisterStudentPayment';

export default function AllStudentsInfo(){
    const [open, setOpen] = React.useState(false);
    const [popUpComp, setPopUpComp] = React.useState('');
    const [state, setState] = React.useState({
        columns: [
            { title: 'Nombre completo', field: 'name', },
            { title: 'Teléfono', field: 'phone', },
            { title: 'Email', field: 'email', },
            { title: 'Grupo', field: 'group', },
            { title: 'Adeudo de clases', field: 'classBalance', },
            { title: 'Adeudo de adicionales', field: 'additionalBalance', },
            { title: 'Ciclo de pago', field: 'cycle', },
            { title: 'Próximo pago', field: 'deadline', },
            

        ],
        data: [],
    })
    React.useEffect(() => {
        axios
        .get("https://sq-academy.herokuapp.com/admin/get_all_students")
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
                    tooltip: 'Ver historial de transacciones',
                    onClick: async (event, rowData) => {
                        const transactions = await getStudentTransactionList(rowData._id);
                        console.log(transactions);
                        setPopUpComp(<TransactionTable transactions={transactions} />)
                        setOpen(true);
                    }
                },
                {
                    icon: 'payments',
                    tooltip: 'Registrar un pago',
                    onClick: (event, rowData) => {
                        setPopUpComp(<RegisterStudentPayment studentId={rowData._id} studentName={rowData.name} />)
                        setOpen(true)
                    }
                }
            ]}
            options={{
                headerStyle: {
                backgroundColor: '#BE375F',
                color: '#FFF'
                }
            }}
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