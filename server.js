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
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Path to local recipe database
const RECIPE_DB = path.join(__dirname, 'recipes.json');

// Initialize database file
if (!fs.existsSync(RECIPE_DB)) {
  fs.writeFileSync(RECIPE_DB, JSON.stringify({ recipes: [] }));
}

// Health check endpoint
app.get('/', (req, res) => {
  res.send('Recipe Finder API is running');
});

// Enhanced exact-match search function
function searchLocalRecipes(ingredients) {
  const db = JSON.parse(fs.readFileSync(RECIPE_DB));
  const searchTerms = ingredients.toLowerCase().split(',').map(term => term.trim());
  
  return db.recipes.filter(recipe => {
    const allIngredientNames = [
      ...recipe.usedIngredients,
      ...recipe.missedIngredients
    ].map(i => i.name.toLowerCase());
    
    return searchTerms.every(term => 
      allIngredientNames.some(name => name.includes(term))
    );
  });
}

// Enhanced recipe processing function
function processRecipes(recipes, searchTerms) {
  return recipes.map(recipe => {
    // Filter to only include ingredients that actually match search terms
    const usedIngredients = recipe.usedIngredients.filter(ingredient => {
      return searchTerms.some(term => 
        ingredient.name.toLowerCase().includes(term)
      );
    });

    // Calculate real match percentage
    const matchPercentage = Math.round(
      (usedIngredients.length / searchTerms.length) * 100
    );

    return {
      ...recipe,
      usedIngredients,
      missedIngredients: recipe.missedIngredients,
      matchPercentage,
      source: recipe.source || 'local',
      matchDetails: {
        matchedTerms: searchTerms.filter(term => 
          [...recipe.usedIngredients, ...recipe.missedIngredients]
            .some(i => i.name.toLowerCase().includes(term))
        ),
        totalSearchTerms: searchTerms.length
      }
    };
  }).filter(recipe => recipe.usedIngredients.length > 0); // Remove recipes with no matches
}

// Recipe search endpoint with improved matching
app.post('/api/getRecipes', async (req, res) => {
  try {
    const { ingredients } = req.body;
    
    if (!ingredients) {
      return res.status(400).json({ error: 'Ingredients are required' });
    }

    const searchTerms = ingredients.toLowerCase().split(',').map(t => t.trim());

    // 1. First try local matching
    let localRecipes = searchLocalRecipes(ingredients);
    let resultRecipes = [];

    if (localRecipes.length > 0) {
      resultRecipes = processRecipes(localRecipes, searchTerms);
      return res.json({ 
        recipes: resultRecipes,
        message: resultRecipes.some(r => r.matchPercentage === 100) ?
          'Found recipes matching all ingredients' :
          'Showing partial matches'
      });
    }

    // 2. If no good local matches, fetch from Spoonacular
    console.log('Fetching from Spoonacular for:', ingredients);
    const response = await axios.get('https://api.spoonacular.com/recipes/findByIngredients', {
      params: {
        ingredients: ingredients,
        number: 12,
        ranking: 1, // Best matches first
        apiKey: process.env.SPOONACULAR_API_KEY
      },
      timeout: 10000
    });

    // Process and save new recipes
    resultRecipes = processRecipes(response.data, searchTerms);
    const db = JSON.parse(fs.readFileSync(RECIPE_DB));
    
    resultRecipes.forEach(newRecipe => {
      if (!db.recipes.some(r => r.id === newRecipe.id)) {
        db.recipes.push({
          ...newRecipe,
          source: 'api'
        });
      }
    });
    
    fs.writeFileSync(RECIPE_DB, JSON.stringify(db, null, 2));

    return res.json({ 
      recipes: resultRecipes,
      source: 'api'
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch recipes',
      details: error.message 
    });
  }
});

// Start server with port fallback
const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`✅ Server running on http://localhost:${port}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} in use, trying ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
  return server;
};

const PORT = process.env.PORT || 5000;
startServer(PORT);