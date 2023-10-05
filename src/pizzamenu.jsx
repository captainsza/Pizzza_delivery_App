import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate  } from 'react-router-dom';
import { useAuth } from './auth/authContext';
import axios from 'axios';
import './components/styles/App.css';
const PizzaMenu = React.memo(() => {
  const [selectedPizzas, setSelectedPizzas] = useState(() => {
    const storedCartItems = localStorage.getItem('cartItems');
    return storedCartItems ? JSON.parse(storedCartItems) : [];
  });
  const [pizzas, setPizzas] = useState([]);
  const [customizingPizza, setCustomizingPizza] = useState(null);
  const { user } = useAuth();
  const [customizationOptions, setCustomizationOptions] = useState({
    base: null,
    sauce: null,
    cheese: null,
    veggies: [],
    pepperoni: false,
    mushrooms: false,
  });
  const taxRate = 0.07;
  const basePrice = 10.0;


  const totalCost = useMemo(
    () => selectedPizzas.reduce((total, pizza) => total + pizza.price * pizza.quantity, 0),
    [selectedPizzas]
  );
  const taxAmount = useMemo(() => totalCost * taxRate, [totalCost]);
  const totalWithTax = useMemo(() => totalCost + taxAmount, [totalCost, taxAmount]);
  const navigate = useNavigate();

  const fetchPizzas = useCallback(async () => {
    try {
      const response = await axios.get('http://192.168.153.16:5000/api/pizzas');
      setPizzas(response.data);
    } catch (error) {
      console.error(error);
    }
  }, []);
  const fetchCartItems = useCallback(async () => {
    if (user) {
      try {
        const response = await axios.get('http://192.168.153.16:5000/api/cart', {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
        if (response.status === 200) {
          updateCartItems(response.data);
        }
      } catch (error) {
        console.error(error);
      }
    }
  }, [user]);

  useEffect(() => {
    fetchPizzas();
  }, [fetchPizzas]);

  useEffect(() => {
    fetchCartItems();
  }, [fetchCartItems]);

  useEffect(() => {
    const storedCartItems = localStorage.getItem('cartItems');
    if (storedCartItems) {
      setSelectedPizzas(JSON.parse(storedCartItems));
    }
  }, []);

  

  const updateCartItems = useCallback(
    (updatedCart) => {
      setSelectedPizzas(updatedCart);
      localStorage.setItem('cartItems', JSON.stringify(updatedCart));
    },
    [setSelectedPizzas]
  );
  const resetCustomizationOptions = useCallback(() => {
    setCustomizationOptions({
      base: null,
      sauce: null,
      cheese: null,
      veggies: [],
      pepperoni: false,
      mushrooms: false,
    });
  }, [updateCartItems]); 
  const calculateCustomPizzaPrice = useCallback(
    (options) => {
      let price = basePrice;
      price += options.cheese === 'extra' ? 2.0 : 0.0;
      price += options.pepperoni ? 1.5 : 0.0;
      price += options.mushrooms ? 1.5 : 0.0;
      return price;
    },
    [basePrice]
  );
  const addToCart = useCallback(
    async (pizza) => {
      if (!user) {
        alert('Please log in to add items to the cart.');
        return;
      }
      try {
        const response = await axios.post(
          'http://192.168.153.16:5000/api/cart/add',
          {
            pizzaId: pizza._id,
            itemname: pizza.name,
          },
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );

        if (response.status === 200) {
          const updatedCart = [
            ...selectedPizzas,
            {
              ...pizza,
              quantity: 1,
              itemname: pizza.name,
              photoLink: pizza.photoLink,
            },
          ];

          updateCartItems(updatedCart);
        } else {
          alert('Failed to add item to cart.');
        }
      } catch (error) {
        console.error(error);
        alert('Failed to add item to cart.');
      }
      if (customizingPizza) {
        const customPizza = {
          ...customizingPizza,
          customization: customizationOptions,
          price: calculateCustomPizzaPrice(customizationOptions),
        };
        const updatedCart = [...selectedPizzas, customPizza];
        updateCartItems(updatedCart);
        setCustomizingPizza(null);
        resetCustomizationOptions();
      } else {
        const existingPizzaIndex = selectedPizzas.findIndex((item) => item._id === pizza._id);
  
        if (existingPizzaIndex !== -1) {
          const updatedCart = [...selectedPizzas];
          updatedCart[existingPizzaIndex].quantity += 1;
          updateCartItems(updatedCart);
        } else {
          const updatedCart = [...selectedPizzas, { ...pizza, quantity: 1 }];
          updateCartItems(updatedCart);
        }
      }
    },
    [
      user,
      selectedPizzas,
      updateCartItems,
      customizingPizza,
      customizationOptions,
      setCustomizingPizza,
      resetCustomizationOptions,
      calculateCustomPizzaPrice, // Include calculateCustomPizzaPrice in the dependency array
    ]
  );
  const removeFromCart = useCallback(
    async (pizza) => {
      const existingPizzaIndex = selectedPizzas.findIndex((item) => item._id === pizza._id);
      try {
        // Make a DELETE request to remove the pizza from the cart
        const response = await axios.delete(`http://192.168.153.16:5000/api/cart/remove/${pizza._id}`, {
          headers: {
            Authorization: `Bearer ${user.token}`, // Pass the user's token for authentication
          },
        });

        if (response.status === 200) {
          // Item removed from cart successfully
          const updatedCart = selectedPizzas.filter((item) => item._id !== pizza._id);
          updateCartItems(updatedCart);
        } else {
          alert('Failed to remove item from cart.');
        }
      } catch (error) {
        console.error(error);
        alert('Failed to remove item from cart.');
      }
      if (existingPizzaIndex !== -1 && selectedPizzas[existingPizzaIndex].quantity > 1) {
        const updatedCart = [...selectedPizzas];
        updatedCart[existingPizzaIndex].quantity -= 1;
        updateCartItems(updatedCart);
      } else if (existingPizzaIndex !== -1 && selectedPizzas[existingPizzaIndex].quantity === 1) {
        const updatedCart = [...selectedPizzas];
        updatedCart.splice(existingPizzaIndex, 1);
        updateCartItems(updatedCart);
      }
    },
    [user, selectedPizzas, updateCartItems]
  );

  const startCustomization = useCallback((pizza) => {
    setCustomizingPizza(pizza);
  }, []);

  const customizePizza = useCallback(
    (category, option) => {
      setCustomizationOptions({
        ...customizationOptions,
        [category]: option,
      });
    },
    [customizationOptions]
  );

  const toggleOption = useCallback(
    (option) => {
      setCustomizationOptions({
        ...customizationOptions,
        [option]: !customizationOptions[option],
      });
    },
    [customizationOptions]
  );
  
const handleCheckout = async () => {
  // Ensure the user is logged in before proceeding to checkout
  if (!user) {
    alert('Please log in to proceed to checkout.');
    return;
  }

  // Create an array of cart items to send to the server
  const cartItemsToCheckout = selectedPizzas.map((pizza) => ({
    pizzaId: pizza._id,
    itemname: pizza.name,
    price: pizza.price, // Add this line
    quantity: pizza.quantity, // Add this line if each selected pizza is counted as one item
  }));

  try {
    // Send a POST request to create a PaymentIntent on your server
    const response = await axios.post(
      'http://192.168.153.16:5000/create-payment-intent',
      {
        cartItems: cartItemsToCheckout,
      },
      {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      }
    );

    if (response.status === 200) {
      navigate(`/checkout?payment_intent_client_secret=${response.data.clientSecret}`);
    } else {
      alert('Failed to create PaymentIntent. Please try again.');
    }
  } catch (error) {
    console.error(error);
    alert('Failed to create PaymentIntent. Please try again.');
  }
};

  return (
    <div className="pizza-menu-container">
      <div className="menu-column">
        <h2>Our Pizza Menu</h2>
        <ul className="pizza-list">
          {pizzas.map((pizza) => (
            <li key={pizza._id}>
              <div className="pizza-info">
                <img src={pizza.photoLink} alt={pizza.name} />
                <div className="pizza-details">
                  <h3>{pizza.name}</h3>
                  <p>₹{pizza.price}</p>
                </div>
              </div>
              <div className="pizza-actions">
                {customizingPizza === pizza ? (
                  <div className="customization-buttons">
                    <button onClick={() => customizePizza('base', pizza.base)}>Choose Base</button>
                    <button onClick={() => customizePizza('sauce', pizza.sauce)}>Choose Sauce</button>
                    <button onClick={() => customizePizza('cheese', pizza.cheese)}>Choose Cheese</button>
                    <button onClick={() => toggleOption('pepperoni')}>
                      {customizationOptions.pepperoni ? 'Remove Pepperoni' : 'Add Pepperoni'}
                    </button>
                    <button onClick={() => toggleOption('mushrooms')}>
                      {customizationOptions.mushrooms ? 'Remove Mushrooms' : 'Add Mushrooms'}
                    </button>
                    <div className="spacer"></div>
                    <button onClick={() => startCustomization(null)}>Continue as Chosen</button>
                  </div>
                ) : (
                  <div className="customization-buttons">
                    <button onClick={() => startCustomization(pizza)}>Customize</button>
                    <div className="spacer"></div>
                    <button onClick={() => addToCart(pizza)}>Add to Cart</button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="cart">
        <h2>Cart</h2>
        <ul>
          {selectedPizzas.map((pizza) => (
            <li key={pizza._id}>
              <div className="cart-item">
              <img
          src={pizza.photoLink}
          alt={pizza.name}
          className="pizza-image"
        />
                <div className="cart-item-details">
                  <h3>{pizza.name}</h3>
                  <p>₹{pizza.price}</p>
                </div>
                <div className="quantity">
                  <button onClick={() => removeFromCart(pizza)}>-</button>
                  <span>{pizza.quantity}</span>
                  <button onClick={() => addToCart(pizza)}>+</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <p>Subtotal: ₹{totalCost.toFixed(2)}</p>
        <p>Tax ({(taxRate * 100).toFixed(2)}%): ₹{taxAmount.toFixed(2)}</p>
        <p>Total: ₹{totalWithTax.toFixed(2)}</p>
        <button className="checkout-button" onClick={handleCheckout}>
          Checkout
        </button>
      </div>
    </div>
  );
});
export default PizzaMenu;