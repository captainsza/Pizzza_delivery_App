import React, { useState } from 'react';
import axios from 'axios';
import ConfirmOTP from '../otpconfirm';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

function Register() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        user_address: '',
        password: '',
        confirmPassword: '',
    });

    const [isRegistered, setIsRegistered] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        setFormData({...formData, [e.target.name]: e.target.value });
    };
    const handleShowPassword = () => setShowPassword(!showPassword);
    const handleSubmit = async(e) => {
        e.preventDefault();
        try {
            if (!isRegistered) {
                // Check if passwords match
                if (formData.password !== formData.confirmPassword) {
                    alert('Passwords do not match');
                    return;
                }

                const res = await axios.post('http://192.168.153.16:5000/api/register', formData);
                console.log(res.data);
                setIsRegistered(true);
            } else if (!isVerified) {} else {}
        } catch (error) {
            console.error(error);
        }
    };

    return ( <
        div className = "form-containerReg" > {
            (isRegistered && !isVerified) ? ( <
                div >
                <
                h2 className = "form-title" > Registration Complete < /h2> <
                p > Please check your email
                for the OTP to complete the registration process. < /p> < /
                div >
            ) : ( <
                div >
                <
                h2 className = "form-title" > Register < /h2> <
                form onSubmit = { handleSubmit }
                className = "form" >
                <
                div className = "form-column" >
                <
                input type = "text"
                name = "name"
                placeholder = "Name"
                onChange = { handleChange }
                /> < /
                div > <
                div className = "form-column" >
                <
                input type = "email"
                name = "email"
                placeholder = "Email"
                onChange = { handleChange }
                /> < /
                div > <
                div className = "form-column" >
                <
                input type = "text"
                name = "user_address"
                placeholder = "Address"
                onChange = { handleChange }
                /> < /
                div > <
                div className = "form-column" >
                <
                input type = { showPassword ? "text" : "password" }
                name = "password"
                placeholder = "Password"
                onChange = { handleChange }
                /> <
                div class = "button-containerReg" >
                <
                button type = "button"
                onClick = { handleShowPassword } > { showPassword ? < FaEyeSlash / > : < FaEye / > } <
                /button> < /
                div > <
                /div> <
                div className = "form-column" >
                <
                input type = { showPassword ? "text" : "password" }
                name = "confirmPassword"
                placeholder = "Confirm Password"
                onChange = { handleChange }
                />

                <
                /div> <
                div className = "form-column" >
                <
                button type = "submit" > Register < /button> < /
                div > <
                /form> < /
                div >
            )
        } {
            !isVerified && formData.email && ( <
                ConfirmOTP email = { formData.email }
                setIsVerified = { setIsVerified }
                />
            )
        } <
        /div>
    );
}

export default Register;