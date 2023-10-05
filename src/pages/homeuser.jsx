import React from 'react';
import BannerAnimation from '../banner';
import PizzaMenu from '../pizzamenu';
import '../components/styles/App.css';
const Home = () => {

  const reviews = [
    { id: 1, text: 'Delicious pizza! Highly recommended.' },
    { id: 2, text: 'Great service and amazing variety.' },
  ];

  return (
    <div className="home-container">
      <BannerAnimation title="CapPizza!" description="much tastier than pizzila pizza's" />
      
      <div className="pizza-container">

  <PizzaMenu />
</div>

      <div className="reviews-container">
        <h2>Customer Reviews</h2>
        <ul>
          {reviews.map((review) => (
            <li key={review.id}>{review.text}</li>
          ))}
        </ul>
      </div>
      <div className="contact-container">
        <h2>Contact Us</h2>
        <p>Email: captainproid@gmail.com</p>
      </div>
      <div className="copyright-container">
        <p>&copy; 2023 Zaid Ahmad. All Rights Reserved.</p>
      </div>
    </div>
  );
};

export default Home;
