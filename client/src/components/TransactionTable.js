import React from 'react';
import { withStyles, makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';

const StyledTableCell = withStyles((theme) => ({
    head: {
      backgroundColor: theme.palette.primary.dark,
      color: theme.palette.common.white,
    },
    body: {
      fontSize: 14,
    },
}))(TableCell);
  
const StyledTableRow = withStyles((theme) => ({
  root: {
    '&:nth-of-type(odd)': {
      backgroundColor: theme.palette.common.white,
    },
  },
}))(TableRow);

const useStyles = makeStyles({
    table: {
      minWidth: 700,
    },
});

export default function CustomizedTables({ transactions }) {
    const classes = useStyles();
    const formatDate = (dateObj) => {
        let newDate = new Date(dateObj);
        console.log(newDate);
        return newDate.toLocaleDateString();
    }
    
    return (
      <TableContainer component={Paper}>
        <Table className={classes.table} aria-label="customized table">
          <TableHead>
            <TableRow>
              <StyledTableCell>Fecha</StyledTableCell>
              <StyledTableCell>Monto</StyledTableCell>
              <StyledTableCell>Tipo</StyledTableCell>
              <StyledTableCell>Descripción</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions.map((transaction) => (
                <StyledTableRow key={transaction._id}>
                    <StyledTableCell component="th" scope="row">
                        {formatDate(transaction.date)}
                    </StyledTableCell>
                    <StyledTableCell align="left">{transaction.amount}</StyledTableCell>
                    <StyledTableCell align="left">{transaction.kind === 'payment' ? ('Pago') : ('Cargo')}</StyledTableCell>
                    <StyledTableCell align="left">{transaction.description}</StyledTableCell>
                </StyledTableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }