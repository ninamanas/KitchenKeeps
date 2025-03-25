module.exports = {
    devServer: {
      proxy: {
        '/recipes': {
          target: 'https://api.spoonacular.com', // Target the Spoonacular API
          changeOrigin: true, // Enable cross-origin requests
          pathRewrite: {
            '^/recipes': '', // Remove '/recipes' prefix when making requests
          },
        },
      },
    },
  };
  