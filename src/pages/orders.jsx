import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../auth/authContext';
import '../components/styles/orderpage.css';
function UserOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      // User is not logged in, handle this condition (e.g., show a login prompt).
      setIsLoading(false);
      return;
    }

    axios.get('http://192.168.153.16:5000/api/user/orders', {
      headers: {
        Authorization: `Bearer ${user.token}` 
      }
    })
      .then((response) => {
        setOrders(response.data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching user orders:', error);
        setIsLoading(false);
      });
  }, [user]);

  if (!user) {
    // Handle the case where the user is not logged in.
    return <div>Please log in to view your orders.</div>;
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="orders-container">
      <h1 className="orders-title">Your Orders</h1>
      <ul className="order-list">
        {orders.map((order) => (
          <li className="order-item" key={order.orderId}>
            <h2 className="order-id">Order ID: {order.orderId}</h2>
            <ul className="item-list">
              {order.items.map((item) => (
                <li className="item" key={item._id}>
                  <div className="item-name">Item Name: {item.itemname}</div>
                  <div className="item-price">Price: ₹{item.price}</div>
                  <div className="item-quantity">Quantity: {item.quantity}</div>
                  <div className="item-status">Status: {item.status}</div>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default UserOrders;
