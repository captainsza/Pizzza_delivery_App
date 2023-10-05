import React, { useEffect, useState } from "react";
import {
  PaymentElement,
  LinkAuthenticationElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useSearchParams, useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import axios from "axios";
import { useAuth } from '../auth/authContext';
function CheckoutForm() {
  const [orderID, setOrderID]=useState("")
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const [selectedPizzas, setSelectedPizzas] = useState([]);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!stripe) {
      return;
    }

    const clientSecret = new URLSearchParams(window.location.search).get(
      "payment_intent_client_secret"
    );

    if (!clientSecret) {
      return;
    }

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      switch (paymentIntent.status) {
        case "succeeded":
          setMessage("Payment succeeded!");
          // Place the order after successful payment
          placeOrder();
          break;
        case "processing":
          setMessage("Your payment is processing.");
          break;
        case "requires_payment_method":
          setMessage("Your payment was not successful, please try again.");
          placeOrder();
          break;
        default:
          setMessage("Something went wrong.");
          break;
      }
    });
  }, [stripe]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `http://${window.location.host}/success?order_id=${orderID}`,
      },
    });

    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        setMessage(error.message);
      } else {
        setMessage("An unexpected error occurred.");
      }
    }

    setIsLoading(false);
  };

  
  const placeOrder = async () => {
    try {
      const response = await axios.post(
        "http://192.168.153.16:5000/api/cart/place-order",
        {},
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      if (response.status === 200) {
        const orderId = response.data.orderId;
        const orderedItems = selectedPizzas.map((pizza) => ({
          pizzaId: pizza._id,
          itemname: pizza.name,
          price: pizza.price,
          quantity: pizza.quantity,
          orderId, // Assign the order ID to each item
        }));
        setOrderID(response.data.orderId)
        const updateStatusResponse = await axios.post(
          "http://192.168.153.16:5000/api/user/order/:orderId/item/:itemId",
          {
            items: orderedItems,
          },
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );

        if (updateStatusResponse.status === 200) {
          alert("Order placed successfully!");
        } else {
          alert("Failed to update order status.");
        }
      } else {
        alert("Failed to place the order.");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to place the order.");
    }
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit}>
      <LinkAuthenticationElement
        id="link-authentication-element"
        onChange={(e) => setEmail(e.target.value)}
      />
      <PaymentElement id="payment-element" />
      <button disabled={isLoading || !stripe || !elements} id="submit">
        <span id="button-text">
          {isLoading ? (
            <div className="spinner" id="spinner"></div>
          ) : (
            "Pay now"
          )}
        </span>
      </button>
      {message && <div id="payment-message">{message}</div>}
    </form>
  );
}

const Checkout = () => {
  const [queryParameters] = useSearchParams();
  const clientSecret = queryParameters.get("payment_intent_client_secret");
  const stripePromise = loadStripe(
    "secret key"
  );
  const appearance = {
    theme: "stripe",
  };
  const options = {
    clientSecret,
    appearance,
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm />
    </Elements>
  );
};

export default Checkout;
