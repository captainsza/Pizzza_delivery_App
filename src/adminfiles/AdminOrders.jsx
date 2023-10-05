// AdminOrders.js
import React, { useState } from 'react';
import axios from 'axios';

function AdminOrders({ user }) {
    const [orderStatus, setOrderStatus] = useState('');

    const handleUpdateOrderStatus = (orderId) => {
        axios.put(`http://192.168.153.16:5000/api/admin/order/${orderId}`, {
                status: orderStatus,
            })
            .then((response) => {
                // Handle successful update
                console.log('Order status updated:', response.data);
            })
            .catch((error) => {
                console.error('Error updating order status:', error);
            });
    };

    return ( <
        div >
        <
        h3 > { user.name }
        's Orders</h3> <
        ul > {
            user.orders.map((order) => ( <
                li key = { order.orderId } >
                Order ID: { order.orderId }, Status: { order.status } <
                input type = "text"
                placeholder = "New Status"
                value = { orderStatus }
                onChange = {
                    (e) => setOrderStatus(e.target.value)
                }
                /> <
                button onClick = {
                    () => handleUpdateOrderStatus(order.orderId)
                } >
                Update Status <
                /button> < /
                li >
            ))
        } <
        /ul> < /
        div >
    );
}

export default AdminOrders;