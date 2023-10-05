// CreateUserList.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';

function CreateUserList() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // Fetch a list of users from your API
    axios.get('http://192.168.153.16:5000/api/users')
      .then((response) => {
        setUsers(response.data);
      })
      .catch((error) => {
        console.error('Error fetching users:', error);
      });
  }, []);

  return (
    <div>
      <h2>Users</h2>
      <ul>
        {users.map((user) => (
          <li key={user._id}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
}

export default CreateUserList;
