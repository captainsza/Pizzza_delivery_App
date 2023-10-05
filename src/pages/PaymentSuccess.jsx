import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/authContext';
const PaymentSuccess = () => {
    const [queryParameters] = useSearchParams()
    const [message, setMessage] = useState("")
    const navigation = useNavigate()
    const { user } = useAuth();
    useEffect(() => {
        const checkStatus = async () => {
            const intent = queryParameters.get('payment_intent');
            const orderID = queryParameters.get('order_id');
            console.log('user', user); 
            if (user && user.token) {
                try {
                    const r = await fetch(`http://192.168.153.16:5000/api/check-payment-status`, {
                        method: 'POST',
                        headers: { 'content-type': 'application/json', Authorization: `Bearer ${user.token}` },
                        body: JSON.stringify({ intent, orderID })
                    });
                    const response = await r.json();
                    console.log('API Response:', response);
                    if (response.success) {
                        setMessage("Your order was successfully placed. You are being redirected to the orders page...");
                        setTimeout(() => {
                            navigation('/orderpage');
                        }, 1000);
                    }
                } catch (error) {
                    console.error('API Request Error:', error);
                    setMessage("There was an error processing your payment. Please try again later.");
                }
            }
        };
        checkStatus();
    }, [user]);
    

    return (
        <center><h3>{message}</h3></center>
    )
}

export default PaymentSuccess