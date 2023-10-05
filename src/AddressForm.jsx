import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function AddressForm({ onSubmitAddress }) {
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const address = {
      street,
      city,
      state,
      pincode,
    };
    onSubmitAddress(address);
    navigate('/payment'); // Navigate to the payment page after submitting the address
  };

  return (
    <div>
      <h2>Enter Your Address</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Street:</label>
          <input type="text" value={street} onChange={(e) => setStreet(e.target.value)} required />
        </div>
        <div>
          <label>City:</label>
          <input type="text" value={city} onChange={(e) => setCity(e.target.value)} required />
        </div>
        <div>
          <label>State:</label>
          <input type="text" value={state} onChange={(e) => setState(e.target.value)} required />
        </div>
        <div>
          <label>Pincode:</label>
          <input type="text" value={pincode} onChange={(e) => setPincode(e.target.value)} required />
        </div>
        <button type="submit">Submit Address</button>
      </form>
    </div>
  );
}

export default AddressForm;
