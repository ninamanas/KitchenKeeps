import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.send('Recipe Finder API is running');
});

// Recipe search endpoint
app.post('/api/getRecipes', async (req, res) => {
  try {
    const { ingredients } = req.body;
    
    if (!ingredients) {
      return res.status(400).json({ error: 'Ingredients are required' });
    }

    // Log the request
    console.log('Searching recipes for:', ingredients);

    const response = await axios.get('https://api.spoonacular.com/recipes/findByIngredients', {
      params: {
        ingredients: ingredients,
        number: 5,  // Get 5 recipes
        apiKey: process.env.SPOONACULAR_API_KEY
      },
      timeout: 10000  // 10 second timeout
    });

    res.json({ recipes: response.data });
  } catch (error) {
    console.error('Error fetching recipes:', error.message);
    
    let status = 500;
    let message = 'Failed to fetch recipes';
    
    if (error.response) {
      status = error.response.status;
      message = error.response.data.message || message;
    }
    
    res.status(status).json({ error: message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`🔑 Using Spoonacular API Key: ${process.env.SPOONACULAR_API_KEY ? 'Yes' : 'No'}`);
});