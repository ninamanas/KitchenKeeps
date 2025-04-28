import axios from 'axios';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

async function fetchRecipes(ingredients) {
  try {
    const response = await axios.get('https://api.spoonacular.com/recipes/findByIngredients', {
      params: {
        ingredients: ingredients.join(','),
        number: 10, // Max allowed
        apiKey: process.env.SPOONACULAR_API_KEY
      }
    });

    const newRecipes = response.data.map(recipe => ({
      ...recipe,
      matchPercentage: 100,
      source: 'manual_add'
    }));

    // Merge with existing recipes
    const currentData = JSON.parse(fs.readFileSync('recipes.json'));
    const updatedRecipes = {
      recipes: [...currentData.recipes, ...newRecipes]
        .filter((v,i,a)=>a.findIndex(t=>(t.id===v.id))===i) // Remove duplicates
    };

    fs.writeFileSync('recipes.json', JSON.stringify(updatedRecipes, null, 2));
    console.log(`Added ${newRecipes.length} recipes`);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Example: Fetch 50 recipes containing flour, sugar, or eggs
fetchRecipes(['chicken','potatoes']);