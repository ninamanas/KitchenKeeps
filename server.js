import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// For __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// CORS configuration
const corsOptions = {
  origin: 'http://localhost:5173', // Your frontend URL
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));  // Use the configured CORS options
app.use(express.json());

// Path to our local recipe database
const RECIPE_DB = path.join(__dirname, 'recipes.json');

// Initialize database file if it doesn't exist
if (!fs.existsSync(RECIPE_DB)) {
  fs.writeFileSync(RECIPE_DB, JSON.stringify({ recipes: [] }));
}

// Health check endpoint
app.get('/', (req, res) => {
  res.send('Recipe Finder API is running');
});

// Helper function to search local recipes
function searchLocalRecipes(ingredients) {
  const db = JSON.parse(fs.readFileSync(RECIPE_DB));
  const searchTerms = ingredients.toLowerCase().split(',').map(term => term.trim());
  
  return db.recipes.filter(recipe => {
    const allIngredients = [
      ...recipe.usedIngredients.map(i => i.name.toLowerCase()),
      ...recipe.missedIngredients.map(i => i.name.toLowerCase())
    ];
    return searchTerms.some(term => 
      allIngredients.some(ing => ing.includes(term))
    );
  });
}

// Updated recipe search endpoint
app.post('/api/getRecipes', async (req, res) => {
  try {
    const { ingredients } = req.body;
    
    if (!ingredients) {
      return res.status(400).json({ error: 'Ingredients are required' });
    }

    // 1. First try local database
    const localRecipes = searchLocalRecipes(ingredients);
    if (localRecipes.length > 0) {
      return res.json({ recipes: localRecipes, source: 'local' });
    }

    // 2. If nothing local, fetch from Spoonacular
    console.log('Fetching new recipes from Spoonacular for:', ingredients);
    const response = await axios.get('https://api.spoonacular.com/recipes/findByIngredients', {
      params: {
        ingredients: ingredients,
        number: 5,
        apiKey: process.env.SPOONACULAR_API_KEY
      },
      timeout: 10000
    });

    // 3. Save new recipes to local database
    const db = JSON.parse(fs.readFileSync(RECIPE_DB));
    response.data.forEach(newRecipe => {
      if (!db.recipes.some(r => r.id === newRecipe.id)) {
        db.recipes.push(newRecipe);
      }
    });
    fs.writeFileSync(RECIPE_DB, JSON.stringify(db, null, 2));

    res.json({ recipes: response.data, source: 'api' });
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('API response:', error.response.data);
    }
    res.status(500).json({ 
      error: 'Failed to fetch recipes',
      details: error.message 
    });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});