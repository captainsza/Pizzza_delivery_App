import React, { useState, useEffect } from 'react';
import '../components/styles/admindashboard.css';

function Dashboard() {
  const [pizzas, setPizzas] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    photoLink: '',
    selectedIngredients: [], // Array to store selected ingredient IDs
  });
  const [inventory, setInventory] = useState([]);
  const [newInventoryItem, setNewInventoryItem] = useState({
    name: '',
    quantity: '',
  });

  const fetchPizzas = async () => {
    try {
      const response = await fetch('http://192.168.153.16:5000/api/pizzas');
      const data = await response.json();
      setPizzas(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchInventory = async () => {
    try {
      const response = await fetch('http://192.168.153.16:5000/api/inventory');
      const data = await response.json();
      setInventory(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchPizzas();
    fetchInventory();
  }, []);

  const handleAddPizza = async () => {
    try {
      const response = await fetch('http://192.168.153.16:5000/api/pizzas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          price: formData.price,
          photoLink: formData.photoLink,
          ingredients: formData.selectedIngredients, // Pass selected ingredients
        }),
      });

      if (response.status === 201) {
        setFormData({
          name: '',
          price: '',
          photoLink: '',
          selectedIngredients: [], // Clear selected ingredients
        });
        fetchPizzas();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeletePizza = async (id) => {
    try {
      const response = await fetch(`http://192.168.153.16:5000/api/pizzas/${id}`, {
        method: 'DELETE',
      });

      if (response.status === 200) {
        fetchPizzas();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddInventoryItem = async () => {
    try {
      const existingItem = inventory.find((item) => item.name === newInventoryItem.name);

      if (existingItem) {
        const updatedQuantity = existingItem.quantity + parseInt(newInventoryItem.quantity, 10);

        const response = await fetch(`http://192.168.153.16:5000/api/inventory/update/${existingItem._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ quantity: updatedQuantity }),
        });

        if (response.status === 200) {
          setNewInventoryItem({
            name: '',
            quantity: '',
          });
          fetchInventory();
        }
      } else {
        // Item doesn't exist, create a new one
        const response = await fetch('http://192.168.153.16:5000/api/inventory/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newInventoryItem),
        });

        if (response.status === 201) {
          setNewInventoryItem({
            name: '',
            quantity: '',
          });
          fetchInventory();
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-header">Admin Pizza Dashboard</h1>
      <div className="add-pizza-form">
        <h2>Add New Pizza</h2>
        <input
          type="text"
          placeholder="Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
        <input
          type="number"
          placeholder="Price"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
        />
        <input
          type="text"
          placeholder="Photo Link"
          value={formData.photoLink}
          onChange={(e) => setFormData({ ...formData, photoLink: e.target.value })}
        />
        <label>Select Ingredients:</label>
        <select
          multiple
          value={formData.selectedIngredients}
          onChange={(e) =>
            setFormData({
              ...formData,
              selectedIngredients: Array.from(e.target.selectedOptions, (option) => option.value),
            })
          }
        >
          {inventory.map((item) => (
            <option key={item._id} value={item._id}>
              {item.name}
            </option>
          ))}
        </select>
        <button className="add-button" onClick={handleAddPizza}>
          Add Pizza
        </button>
      </div>
      <div>
        <h2>Pizza List</h2>
        <ul className="pizza-list">
          {pizzas.map((pizza) => (
            <li className="pizza-item" key={pizza._id}>
              <span>
                {pizza.name} - ₹{pizza.price}
              </span>
              <button onClick={() => handleDeletePizza(pizza._id)}>Delete</button>
            </li>
          ))}
        </ul>
      </div>
      <div className="add-inventory-form">
        <h2>Add / Update Inventory Item</h2>
        <input
          type="text"
          placeholder="Name"
          value={newInventoryItem.name}
          onChange={(e) => setNewInventoryItem({ ...newInventoryItem, name: e.target.value })}
        />
        <input
          type="number"
          placeholder="Quantity"
          value={newInventoryItem.quantity}
          onChange={(e) => setNewInventoryItem({ ...newInventoryItem, quantity: e.target.value })}
        />
        <button className="add-button" onClick={handleAddInventoryItem}>
          Add / Update Inventory Item
        </button>
      </div>
    </div>
  );
}

export default Dashboard;
