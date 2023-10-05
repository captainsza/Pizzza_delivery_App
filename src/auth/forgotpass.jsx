import React, { useState } from 'react';
import axios from 'axios'; // Import Axios for making API requests

function ForgotPasswordModal({ onClose }) {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [step, setStep] = useState(1); // Track the step of the forgot password process

    const handleSendOtp = async() => {
        try {
            // Send a request to the server to generate and send the OTP to the user's email
            await axios.post('http://192.168.153.16:5000/api/forgot-password', { email });
            // Transition to the next step
            setStep(2);
        } catch (error) {
            console.error(error);
            // Handle error here (e.g., display an error message to the user)
        }
    };

    const handleResetPassword = async() => {
        try {
            // Send a request to the server to reset the password using OTP and new password
            await axios.post('http://192.168.153.16:5000/api/reset-password', { email, otp, newPassword });
            // Close the modal after successful password reset
            onClose();
        } catch (error) {
            console.error(error);
            // Handle error here (e.g., display an error message to the user)
        }
    };

    return ( <
            div className = "forgot-password-modal" >
            <
            h3 > Forgot Password < /h3> {
            step === 1 && ( <
                >
                <
                p > Enter your email to receive an OTP to reset your password. < /p> <
                input type = "email"
                placeholder = "Email"
                value = { email }
                onChange = {
                    (e) => setEmail(e.target.value)
                }
                /> <
                button onClick = { handleSendOtp } > Send OTP < /button> < / >
            )
        } {
            step === 2 && ( <
                >
                <
                p > Enter the OTP sent to your email and your new password. < /p> <
                input type = "text"
                placeholder = "OTP"
                value = { otp }
                onChange = {
                    (e) => setOtp(e.target.value)
                }
                /> <
                input type = "password"
                placeholder = "New Password"
                value = { newPassword }
                onChange = {
                    (e) => setNewPassword(e.target.value)
                }
                /> <
                button onClick = { handleResetPassword } > Reset Password < /button> < / >
            )
        } <
        /div>
);
}

export default ForgotPasswordModal;