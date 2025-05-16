const express = require('express');
const cors = require('cors');
const path = require('path');
const openaiRouter = require('./openai-direct');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from landing-pages directory
app.use('/landing-page', express.static(path.join(__dirname, 'landing-pages')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api', openaiRouter);

// Basic route for testing
app.get('/', (req, res) => {
    res.json({ message: 'API is running!' });
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
}); 