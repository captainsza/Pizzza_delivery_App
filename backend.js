const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
require('dotenv').config({ path: './Config/config.env' });
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const stripkey = process.env.STRIPE_SECRET_KEY;
const stripe = require("stripe")(stripkey);
const app = express();
const port = process.env.PORT || 5000;
app.use(cors());
const dbURI = process.env.MONGODB_CONNECTION_STRING;
const gmailUser = process.env.GMAIL_USER;
const gmailPassword = process.env.GMAIL_PASSWORD;
const jwtSecret = process.env.JWT_SECRET;


mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .catch(error => console.error('Error connecting to MongoDB:', error.message));

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: gmailUser,
        pass: gmailPassword,
    },
});
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    isVerified: Boolean,
    otp: String,
    user_address: String,
    cartItems: [{
        pizza: { type: mongoose.Schema.Types.ObjectId, ref: 'Pizza' },
        quantity: Number,
        itemname: String,
        photoLink: String,
        price: Number,
    }],
    orders: [{
        orderId: String,
        status: String,
        items: [{
            pizza: { type: mongoose.Schema.Types.ObjectId, ref: 'Pizza' },
            quantity: Number,
            itemname: String,
            photoLink: String,
            price: Number,
            status: String, // Status for each item in the order
        }],
    }],
    date: { type: Date, default: Date.now },
    token: String,
});


const pizzaSchema = new mongoose.Schema({
    name: String,
    price: Number,
    photoLink: String,
    ingredients: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Inventory',
    }, ],
});


const inventorySchema = new mongoose.Schema({
    name: String,
    quantity: Number,
});

module.exports = mongoose.model('Inventory', inventorySchema);
module.exports = mongoose.model('User', userSchema);
module.exports = mongoose.model('Pizza', pizzaSchema);
const Inventory = mongoose.model('Inventory', inventorySchema)
const Pizza = mongoose.model('Pizza', pizzaSchema);
const User = mongoose.model('User', userSchema);

const generateOTP = () => [...Array(6)].map(() => Math.floor(Math.random() * 10)).join('');
const generateUniqueOrderId = () => [...Array(8)].map(() => Math.floor(Math.random() * 10)).join('');
app.get("/", (req, res) => {
    res.json({ message: "hello" })
})
app.post(
    '/api/register', [
        body('name').notEmpty().trim().isString(),
        body('email').isEmail(),
        body('user_address').notEmpty().trim().isString(),
        body('password').isLength({ min: 6 }),
    ],
    async(req, res) => {
        try {
            const { name, email, user_address, password } = req.body;
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: 'User already exists' });
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            const otp = generateOTP();
            const newUser = new User({
                name,
                email,
                password: hashedPassword,
                isVerified: false,
                user_address,
                otp,
            });

            await newUser.save();

            const mailOptions = {
                from: 'your-gmail-email@gmail.com',
                to: email,
                subject: 'Email Verification',
                text: `Your OTP for email verification is: ${otp}`,
            };


            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Email sending failed:', error);
                    return res.status(500).json({ message: 'Email verification failed', error: error.message });
                }
                console.log('Verification email sent:', info.response);
                res.status(201).json({ message: 'Registration successful' });
            });
        } catch (error) {
            console.error('Server Error:', error);
            res.status(500).json({ message: 'Server Error', error: error.message });
        }
    }
);
app.get('/api/verify/:token', async(req, res) => {
    try {
        const { token } = req.params;

        const user = await User.findOne({ otp: token });
        if (!user) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        user.isVerified = true;
        user.otp = '';
        await user.save();

        res.json({ message: 'Email verified successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});
app.post('/api/login', async(req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        if (!user.isVerified) {
            return res.status(401).json({ message: 'Email not verified' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid password' });
        }
        const token = jwt.sign({ id: user._id }, jwtSecret);
        user.token = token;
        await user.save();

        res.json({ token, name: user.name, user_address: user.user_address });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});
const extractUserIdMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decodedToken = jwt.verify(token, jwtSecret);
        req.userId = decodedToken.id;
        next();
    } catch (error) {
        console.error('Error occurred while verifying token: ', error);
        next(error)
    }
};
app.get('/api/user', async(req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decodedToken = jwt.verify(token, jwtSecret);
        const userId = decodedToken.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ email: user.email, name: user.name, user_address: user.user_address });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});
app.get('/api/user', extractUserIdMiddleware, async(req, res, next) => {
    try {
        const userId = req.userId;
        User.findById(userId)
            .then(user => {
                if (!user) {
                    return res.status(404).json({ message: 'User not found' });
                }
                res.json({ email: user.email, name: user.name, user_address: user.user_address });
            })
            .catch(error => {
                console.error('Error occurred while finding user: ', error);
                next(error);
            });
    } catch (error) {
        console.error('Error occurred while processing request: ', error);
        next(error);
    }
});
app.post('/api/forgot-password', async(req, res) => {
    try {
        const { email } = req.body;


        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }


        const otp = generateOTP();

        user.otp = otp;
        await user.save();

        const mailOptions = {
            from: 'your-gmail-email@gmail.com',
            to: email,
            subject: 'Password Reset OTP',
            text: `Your OTP for password reset is: ${otp}`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Email sending failed:', error);
                return res.status(500).json({ message: 'Email sending failed', error: error.message });
            }
            console.log('OTP email sent:', info.response);
            res.json({ message: 'OTP sent successfully' });
        });
    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

function sendNotification(toEmail, lowInventoryItems) {
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: gmailUser,
            pass: gmailPassword,
        },
    });

    // Create a table for low inventory items
    let message = '<h1>Low Inventory Alert</h1>';
    message += '<table border="1">';
    message += '<tr><th>Item Name</th><th>Quantity</th></tr>';

    for (const item of lowInventoryItems) {
        message += `<tr><td>${item.name}</td><td>${item.quantity}</td></tr>`;
    }

    message += '</table>';

    const mailOptions = {
        from: gmailUser,
        to: toEmail,
        subject: 'Low Inventory Alert',
        html: message, // Use HTML format for improved style
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending notification email:', error);
        } else {
            console.log('Notification email sent:', info.response);
        }
    });
}


// Call the checkInventoryThreshold function periodically (e.g., every hour)
setInterval(checkInventoryThreshold, 30000);
async function checkInventoryThreshold() {
    try {
        const threshold = 20; // Set your threshold value
        const lowInventoryItems = await Inventory.find({ quantity: { $lt: threshold } });

        if (lowInventoryItems.length > 0) {
            // Send a notification to the admin (you can use an email service or other notification mechanism here)
            const adminEmail = gmailUser; // Replace with your admin's email address
            const message = `Low inventory alert: ${lowInventoryItems.length} items have stock below the threshold.`;

            sendNotification(adminEmail, lowInventoryItems);
        }
    } catch (error) {
        console.error('Error checking inventory threshold:', error);
    }
}

app.post('/api/reset-password', async(req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        if (user.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }


        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;
        user.otp = '';
        await user.save();

        res.json({ message: 'Password reset successful' });
    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});
app.post('/api/inventory/add', async(req, res) => {
    try {
        const { name, quantity } = req.body;
        const inventoryItem = new Inventory({ name, quantity });
        await inventoryItem.save();
        res.status(201).json({ message: 'Inventory item added successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});
app.get('/api/inventory', async(req, res) => {
    try {
        const inventoryItems = await Inventory.find();
        res.json(inventoryItems);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});
app.put('/api/inventory/update/:id', async(req, res) => {
    const itemId = req.params.id;
    const updatedQuantity = req.body.quantity;
    try {
        const updatedItem = await Inventory.findById(itemId);
        if (!updatedItem) {
            return res.status(404).json({ message: 'Inventory item not found' });
        }

        updatedItem.quantity = updatedQuantity;
        await updatedItem.save();

        return res.status(200).json(updatedItem);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});
app.post('/api/order', async(req, res) => {
    try {
        const { pizzas } = req.body;
        for (const pizza of pizzas) {
            for (const ingredientId of pizza.ingredients) {
                const ingredient = await Inventory.findById(ingredientId);
                if (ingredient) {
                    ingredient.quantity -= 1;
                    await ingredient.save();
                }
            }
        }
        res.status(200).json({ message: 'Order placed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

app.get('/api/pizzas', async(req, res) => {
    try {
        const pizzas = await Pizza.find();
        res.json(pizzas.map((pizza) => ({
            _id: pizza._id,
            name: pizza.name,
            price: pizza.price,
            photoLink: pizza.photoLink,
        })));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});
app.post('/api/pizzas', async(req, res) => {
    try {
        const { name, price, photoLink, ingredients } = req.body;
        const pizza = new Pizza({ name, price, photoLink, ingredients });
        await pizza.save();
        res.status(201).json({ message: 'Pizza added successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});
app.put('/api/pizzas/:id', async(req, res) => {
    try {
        const { id } = req.params;
        const { price, photoLink } = req.body;
        const pizza = await Pizza.findByIdAndUpdate(
            id, { price, photoLink }, { new: true }
        );
        res.json(pizza);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

app.delete('/api/pizzas/:id', async(req, res) => {
    try {
        const { id } = req.params;
        await Pizza.findByIdAndDelete(id);
        res.json({ message: 'Pizza deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

app.get('/api/cart', extractUserIdMiddleware, async(req, res) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId).populate('cartItems');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user.cartItems);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});
const calculateOrderAmount = (cartItems) => {
    try {
        const total = cartItems.reduce((acc, item) => {
            if (typeof item.price !== 'number' || typeof item.quantity !== 'number' || isNaN(item.price) || isNaN(item.quantity) || item.quantity <= 0) {
                throw new Error(`Invalid price or quantity for item: ${JSON.stringify(item)}`);
            }
            return acc + item.price * item.quantity;
        }, 0);
        return total;
    } catch (error) {
        console.error('Error calculating order amount:', error);
        throw error;
    }
}; // Function to update inventory for a pizza
async function updateInventoryForPizza(pizzaId) {
    try {
        const pizza = await Pizza.findById(pizzaId);

        if (!pizza) {
            console.error('Pizza not found');
            return;
        }

        // Decrement the inventory for each ingredient used in the pizza
        for (const ingredientId of pizza.ingredients) {
            const ingredient = await Inventory.findById(ingredientId);

            if (ingredient && ingredient.quantity > 0) {
                ingredient.quantity -= 1;
                await ingredient.save();
            }
        }
    } catch (error) {
        console.error('Error updating inventory for pizza: ', error);
    }
}
app.post('/api/cart/add', extractUserIdMiddleware, async(req, res, next) => {
    try {
        const { pizzaId, itemname } = req.body;
        const userId = req.userId;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const pizza = await Pizza.findById(pizzaId);

        if (!pizza) {
            return res.status(404).json({ message: 'Pizza not found' });
        }

        // Check if the pizza already exists in the cart
        const existingCartItemIndex = user.cartItems.findIndex(
            (item) => item.pizza.toString() === pizzaId
        );

        if (existingCartItemIndex !== -1) {
            // If the pizza exists in the cart, increase the quantity
            user.cartItems[existingCartItemIndex].quantity += 1;
        } else {
            // If the pizza doesn't exist in the cart, add it to the cart
            user.cartItems.push({
                pizza: pizzaId,
                quantity: 1,
                price: pizza.price,
                itemname: itemname,
                photoLink: pizza.photoLink,
            });
        }

        await user.save();

        // Call a function to update inventory here
        await updateInventoryForPizza(pizzaId);

        // Return the updated cart and a client secret for payment
        const paymentIntent = await stripe.paymentIntents.create({
            amount: calculateOrderAmount(user.cartItems),
            currency: 'inr',
            automatic_payment_methods: {
                enabled: true,
            },
        });

        res.json({
            message: 'Item added to cart successfully',
            clientSecret: paymentIntent.client_secret,
            cart: user.cartItems,
        });
    } catch (error) {
        console.error('Error occurred while adding item to cart: ', error);
        next(error);
    }
});

async function updateInventoryForPizza(pizzaId) {
    try {
        const pizza = await Pizza.findById(pizzaId);

        if (!pizza) {
            console.error('Pizza not found');
            return;
        }

        for (const ingredientId of pizza.ingredients) {
            const ingredient = await Inventory.findById(ingredientId);

            if (ingredient && ingredient.quantity > 0) {
                ingredient.quantity -= 1;
                await ingredient.save();
            }
        }
    } catch (error) {
        console.error('Error updating inventory for pizza: ', error);
    }
}
// Add a new endpoint to handle adding a pizza to the cart


app.delete('/api/cart/remove/:pizzaId', extractUserIdMiddleware, async(req, res, next) => {
    try {
        const { pizzaId } = req.params;
        const userId = req.userId;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const cartItemIndex = user.cartItems.findIndex((item) =>
            item.pizza.toString() === pizzaId
        );

        if (cartItemIndex !== -1) {
            if (user.cartItems[cartItemIndex].quantity > 1) {
                user.cartItems[cartItemIndex].quantity -= 1;
            } else {
                user.cartItems.splice(cartItemIndex, 1);
            }
            await user.save();
            res.json({ message: 'Item removed from cart successfully' });
        } else {
            res.status(404).json({ message: 'Item not found in cart' });
        }
    } catch (error) {
        console.error('Error occurred while removing item from cart: ', error);
        next(error);
    }
});
app.post('/create-payment-intent', async(req, res) => {
    try {
        const { cartItems } = req.body;
        const totalAmount = calculateOrderAmount(cartItems);
        const paymentIntent = await stripe.paymentIntents.create({
            amount: totalAmount * 100,
            currency: 'inr',
            automatic_payment_methods: {
                enabled: true,
            },
        });
        res.send({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});
app.put('/api/admin/order/:orderId', async(req, res) => {
    try {
        const { orderId, status } = req.body;
        const userId = req.userId;

        // Find the user and update the order status
        const user = await User.findOneAndUpdate({ _id: userId, 'orders.orderId': orderId }, { $set: { 'orders.$.status': status } }, { new: true });

        if (!user) {
            return res.status(404).json({ message: 'User or order not found' });
        }

        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});
// Add a new API endpoint to place an order
app.post('/api/cart/place-order', extractUserIdMiddleware, async(req, res, next) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const orderId = generateUniqueOrderId();
        const order = {
            orderId,
            status: 'Pending',
            items: user.cartItems.map(item => ({
                pizza: item.pizza,
                quantity: item.quantity,
                price: item.price,
                itemname: item.itemname,
                photoLink: item.photoLink,
            })),
        };
        user.orders.push(order);
        user.cartItems = [];
        await user.save();
        await checkInventoryThreshold();
        res.json({ message: 'Order placed successfully', orderId });
    } catch (error) {
        console.error('Error occurred while placing the order: ', error);
        next(error);
    } // Update the order status for a specific item in a user's order
    app.put('/api/user/order/:orderId/item/:itemId', extractUserIdMiddleware, async(req, res, next) => {
        try {
            const { orderId, itemId } = req.params;
            const { status } = req.body;
            const userId = req.userId;
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            const order = user.orders.find(order => order.orderId === orderId);
            if (!order) {
                return res.status(404).json({ message: 'Order not found' });
            }
            const item = order.items.find(item => item._id.toString() === itemId);
            if (!item) {
                return res.status(404).json({ message: 'Item not found in the order' });
            }
            item.status = status;

            await user.save();

            res.json({ message: 'Order status updated successfully' });
        } catch (error) {
            console.error('Error occurred while updating order status: ', error);
            next(error);
        }
    });

});
app.get('/api/user/orders', extractUserIdMiddleware, async(req, res) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user.orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});
app.get('/api/users', async(req, res) => {
    try {
        const users = await User.find({}, 'name');

        res.json(users);

    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});
// Add this route to your Express server
app.put('/api/admin/order/:orderId', async(req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;
        const userId = req.userId; // Assuming you have middleware to extract the admin's user ID

        // Find the user and update the order status
        const user = await User.findOneAndUpdate({ _id: userId, 'orders.orderId': orderId }, { $set: { 'orders.$.status': status } }, { new: true });

        if (!user) {
            return res.status(404).json({ message: 'User or order not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});


app.post('/api/check-payment-status', extractUserIdMiddleware, async(req, res) => {
    const { intent, orderID } = req.body;
    const userId = req.userId
    const user = await User.findOne({ _id: userId })
    if (!user) return res.json({ success: false })
    const order = user.orders
    console.log(order);
    const paymentIntent = await stripe.paymentIntents.retrieve(
        intent
    );
    if (paymentIntent.status === 'succeeded') {
        const newOrder = order.map((o) => o.orderId === orderID ? {...o, status: 'Placed' } : o)
        const u = await User.updateOne({ _id: userId }, { '$set': { orders: newOrder } })
        return res.json({ success: true })
    }
});
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Server Error');
});
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});