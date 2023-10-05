import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const login = async(email, password) => {
        try {
            const response = await axios.post('http://192.168.153.16:5000/api/login', { email, password });
            const { token, name, user_address } = response.data;
            localStorage.setItem('user', JSON.stringify({ email, name, user_address, token }));

            const userResponse = await axios.get('http://192.168.153.16:5000/api/user', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const userData = userResponse.data;


            setUser({...userData, token });
        } catch (error) {
            console.error(error);
            throw new Error('Failed to log in');
        }
    };

    const logout = () => {
        localStorage.removeItem('user');
        setUser(null);
    };

    return ( <
        AuthContext.Provider value = {
            { user, login, logout }
        } > { children } <
        /AuthContext.Provider>
    );
}