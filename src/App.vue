<template>
  <div class="app">
    <h1>🍳 Kitchen Keeps</h1>
    <h5>recipe finder</h5>
    
    <div class="search-container">
      <div class="input-area">
        <input
          v-model="userInput"
          placeholder="Enter ingredients (e.g., chicken, potatoes, cheese)"
          @keyup.enter="getRecipes"
        />
        <button @click="getRecipes">Find Recipes</button>
      </div>

      <!-- Results Header - moved outside recipes div -->
      <div v-if="recipes.length" class="results-header">
        <div class="results-count" :class="allPerfectMatches ? 'perfect-match' : 'partial-match'">
          <span v-if="allPerfectMatches"></span>
          <span v-else>🔍</span>
          Found {{ recipes.length }} recipe(s) {{ allPerfectMatches ? 'using ALL' : 'containing' }} your ingredients!
        </div>
        <div class="search-terms">
          Your search: <strong>{{ userInput }}</strong>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading">Searching for recipes...</div>
    <div v-if="error" class="error">{{ error }}</div>

    <!-- Recipes Grid -->
    <div v-if="recipes.length" class="recipes">
      <div v-for="recipe in recipes" :key="recipe.id" class="recipe-card">
        <div class="recipe-header">
          <h3>{{ recipe.title }}</h3>
          <div class="match-score" :class="getMatchClass(recipe.matchPercentage)">
            {{ Math.round(recipe.matchPercentage) }}% match
          </div>
        </div>
        
        <img :src="recipe.image" :alt="recipe.title" class="recipe-image">
        
        <div class="ingredients">
          <div v-if="recipe.usedIngredients.length">
            <h4>✅ Ingredients matching your search ({{ recipe.usedIngredients.length }})</h4>
            <ul>
              <li v-for="ingredient in recipe.usedIngredients" :key="'used-'+ingredient.id">
                {{ ingredient.name }}
              </li>
            </ul>
          </div>
          
          <div v-if="recipe.missedIngredients.length">
            <h4>❌ Ingredients you need ({{ recipe.missedIngredients.length }})</h4>
            <ul>
              <li v-for="ingredient in recipe.missedIngredients" :key="'missed-'+ingredient.id">
                {{ ingredient.name }}
              </li>
            </ul>
          </div>
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
    <div v-else-if="!loading && userInput" class="no-results">
      No recipes found matching all your ingredients. Try different combinations.
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      userInput: "",
      recipes: [],
      loading: false,
      error: ""
    };
  },
  computed: {
    allPerfectMatches() {
      return this.recipes.every(recipe => recipe.matchPercentage === 100);
    }
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
        const response = await fetch("http://localhost:5000/api/getRecipes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            ingredients: this.userInput
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Filter recipes to only show ingredients that match search terms
        this.recipes = data.recipes.map(recipe => {
          const searchTerms = this.userInput.toLowerCase().split(',').map(t => t.trim());
          
          const used = recipe.usedIngredients.filter(ing => 
            searchTerms.some(term => 
              ing.name.toLowerCase().includes(term)
            )
          );
          
          return {
            ...recipe,
            usedIngredients: used,
            missedIngredients: recipe.missedIngredients,
            matchPercentage: used.length > 0 ? 100 : 0
          };
        }).filter(recipe => recipe.usedIngredients.length > 0);

        if (this.recipes.length === 0) {
          this.error = "No recipes found with these ingredients";
        }
      } catch (err) {
        console.error("API Error:", err);
        this.error = err.message || "Failed to fetch recipes. Please try again.";
      } finally {
        this.loading = false;
      }
    },
    getMatchedTerm(ingredientName) {
      const searchTerms = this.userInput.toLowerCase().split(',').map(t => t.trim());
      return searchTerms.find(term => 
        ingredientName.toLowerCase().includes(term)
      );
    },
    getMatchClass(percentage) {
      if (percentage >= 80) return 'excellent';
      if (percentage >= 50) return 'good';
      if (percentage >= 30) return 'fair';
      return 'poor';
    }
  }
};
</script>

<style>
@import './styles.css';
</style> 