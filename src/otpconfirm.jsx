import React, { useState } from 'react';
import axios from 'axios';

function ConfirmOTP({ email }) {
    const [otp, setOTP] = useState('');
    const [message, setMessage] = useState('');

    const handleOTPChange = (e) => {
        setOTP(e.target.value);
    };

    const handleConfirmOTP = async(e) => {
        e.preventDefault();
        try {
            const res = await axios.get(`http://192.168.153.16:5000/api/verify/${otp}`);
            setMessage(res.data.message);
        } catch (error) {
            console.error(error);
            setMessage('Error confirming OTP');
        }
    };

    return ( <
        div className = "form-container" >
        <
        h2 className = "form-title" > Confirm OTP < /h2> <
        form onSubmit = { handleConfirmOTP }
        className = "form" >
        <
        div className = "form-column" >
        <
        p > Enter the OTP sent to { email } < /p> <
        input type = "text"
        name = "otp"
        placeholder = "OTP"
        onChange = { handleOTPChange }
        /> < /
        div > <
        div className = "form-column" >
        <
        button type = "submit" > Confirm OTP < /button> < /
        div > <
        div className = "form-column" >
        <
        p > { message } < /p> < /
        div > <
        /form> < /
        div >
    );
}

export default ConfirmOTP;