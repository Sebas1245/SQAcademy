import React from 'react';
import {Link} from 'react-router-dom'


const HomePage = () => {
    return( 
        <Link to="/login">
            <h3>Login</h3>
        </Link>
    )
}

export default HomePage;