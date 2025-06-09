const express = require('express');
const cors = require('cors');
const { initializeDatabase, testConnection } = require('./db');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

// Configure CORS to allow requests from the frontend running on port 5500
const corsOptions = {
  origin: 'http://127.0.0.1:5500', // Allow requests from this origin
  credentials: true, // Allow cookies or authorization headers if needed
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

app.use(cors(corsOptions)); // Apply the CORS configuration
app.use(express.json());
app.use('/api', apiRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

async function startServer() {
  try {
    await initializeDatabase();
    await testConnection();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();