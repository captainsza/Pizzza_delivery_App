import React, { useState } from 'react';
import { useAuth } from './authContext';
import ForgotPasswordModal from './forgotpass'; // Create this component
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

function Login() {
    const { login } = useAuth();
    const navigate = useNavigate(); // Initialize useNavigate
    const [showSuccessBanner, setShowSuccessBanner] = useState(false);
    const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
    const [error, setError] = useState(null);
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const handleChange = (e) => {
        setFormData({...formData, [e.target.name]: e.target.value });
    };
    const handleShowPassword = () => setShowPassword(!showPassword);
    const handleSubmit = async(e) => {
        e.preventDefault();
        try {
            await login(formData.email, formData.password);
            setShowSuccessBanner(true);
            setError(null);
            // Redirect to the homepage after successful login
            navigate('/');
        } catch (error) {
            console.error(error);
            setError(error.message);
            setShowSuccessBanner(false);
        }
    };

    return ( <
        div className = "form-containerReg" >
        <
        h2 className = "form-title" > Login < /h2> {
            showSuccessBanner && ( <
                div className = "success-banner" > Successful Login! < /div>
            )
        } {
            error && ( <
                div className = "error-banner" > { error } < /div>
            )
        } <
        form onSubmit = { handleSubmit }
        className = "form" >
        <
        div className = "form-column" >
        <
        input type = "email"
        name = "email"
        placeholder = "Email"
        onChange = { handleChange }
        /> <
        /div> <
        div className = "form-column" >
        <
        input type = { showPassword ? "text" : "password" }
        name = "password"
        placeholder = "Password"
        onChange = { handleChange }
        /> <
        /div> <
        div class = "button-container" >
        <
        button type = "button"
        onClick = { handleShowPassword }
        style = {
            { background: 'transparent', border: 'none' } } > { showPassword ? < FaEyeSlash / > : < FaEye / > } <
        /button> <
        /div> <
        div className = "form-column" >
        <
        button type = "submit" > Login < /button> <
        /div> <
        div className = "form-column" >
        <
        button type = "button"
        onClick = {
            () => setShowForgotPasswordModal(true) } >
        Forgot Password <
        /button> <
        /div> <
        /form> {
            showForgotPasswordModal && ( <
                ForgotPasswordModal onClose = {
                    () => setShowForgotPasswordModal(false) }
                />
            )
        } <
        /div>
    );
}

export default Login;