import React from 'react';
import axios from 'axios';
import MaterialTable from 'material-table';

function DisplayLateStudents() {
  const [state, setState] = React.useState( {
    columns: [
      { title: 'Nombre', field: 'name' },
      { title: 'Teléfono', field: 'phone'},
      { title: 'Correo electrónico', field: 'email'},
    ],
    data: []
  });

  React.useEffect(() => {
    axios
    .get("http://localhost:5000/admin/get_all_students")
    .then((res)=> {
      setState({
        ...state,
        data: res.data.lateStudents
      })
    })
    .catch((err) => {
      console.log(err);
      alert(JSON.stringify(err));
    })
  }, []);
  return(
      <MaterialTable
      title="Alumnos atrasados con su pago"
      columns={state.columns}
      data={state.data}
      />
  )
}

export default DisplayLateStudents
