<template>
  <div class="app">
    <h1>🍳 Kitchen Keeps</h1>
    <h5>recipe finder</h5>
    
    <div class="input-area">
      <input
        v-model="userInput"
        placeholder="Enter ingredients (e.g., chicken, potatoes)"
        @keyup.enter="getRecipes"
      />
      <button @click="getRecipes">Find Recipes</button>
    </div>

    <div v-if="loading" class="loading">Searching for recipes...</div>
    <div v-if="error" class="error">{{ error }}</div>

    <div v-if="recipes.length" class="recipes">
      <div v-for="recipe in recipes" :key="recipe.id" class="recipe-card">
        <h3>{{ recipe.title }}</h3>
        <img :src="recipe.image" :alt="recipe.title" class="recipe-image">
        
        <div class="ingredients">
          <h4>Ingredients you have:</h4>
          <ul>
            <li v-for="ingredient in recipe.usedIngredients" :key="'used-'+ingredient.id">
              {{ ingredient.name }}
            </li>
          </ul>
          
          <h4>Ingredients you need:</h4>
          <ul>
            <li v-for="ingredient in recipe.missedIngredients" :key="'missed-'+ingredient.id">
              {{ ingredient.name }}
            </li>
          </ul>
        </div>
        
        <a 
          :href="`https://spoonacular.com/recipes/${recipe.title.replace(/\s+/g, '-')}-${recipe.id}`" 
          target="_blank"
          class="view-recipe"
        >
          View Full Recipe
        </a>
      </div>
    </div>
  </div>
</template>

<script>
// Your script section remains exactly the same
export default {
  data() {
    return {
      userInput: "",
      recipes: [],
      loading: false,
      error: ""
    };
  },
  methods: {
    async getRecipes() {
      if (!this.userInput.trim()) {
        this.error = "Please enter some ingredients";
        return;
      }

      this.loading = true;
      this.error = "";
      this.recipes = [];

      try {
        const response = await fetch("http://localhost:3000/api/getRecipes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            ingredients: this.userInput
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        this.recipes = data.recipes;

        if (this.recipes.length === 0) {
          this.error = "No recipes found with these ingredients";
        }
      } catch (err) {
        console.error("Error fetching recipes:", err);
        this.error = "Failed to fetch recipes. Please try again.";
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style>
@import './styles.css';
</style>