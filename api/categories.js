import { api, endpoints, categories } from "./const.js";

document.addEventListener('DOMContentLoaded', () => {
   const container = document.querySelector('.row--grid');

   if (!container) return;

   const loadingBlocks = Array.from(container.querySelectorAll('.col-12.col-sm-6.col-lg-4.col-xl-3')).slice(0, 4);
   container.innerHTML = '';
   loadingBlocks.forEach(block => container.appendChild(block));

   const usedBackdrops = new Set();
   const allCategories = [];

   categories.common.forEach(category => {
      if (!allCategories.some(c => c.id === category.id)) {
         allCategories.push(category);
      }
   });

   const processedExtraIds = new Set();
   categories.extras.forEach(category => {
      if (!processedExtraIds.has(category.id)) {
         if (category.id === 10759 || category.id === 10765 || category.id === 10768) {
         } else if (!allCategories.some(c => c.id === category.id)) {
            allCategories.push(category);
         }
         processedExtraIds.add(category.id);
      }
   });

   allCategories.sort((a, b) => a.name.localeCompare(b.name));

   allCategories.forEach(category => {
      const categoryElement = document.createElement('div');
      categoryElement.className = 'col-12 col-sm-6 col-lg-4 col-xl-3';
      categoryElement.innerHTML = `
         <a href="search.html?genre=${category.id}" class="category">
            <div class="category__cover">
               <img src="img/category/default.jpg" alt="${category.name}" loading="lazy">
            </div>
            <h3 class="category__title">${category.name}</h3>
            <span class="category__value">...</span>
         </a>
      `;

      container.appendChild(categoryElement);

      fetchCategoryData(category.id, categoryElement, usedBackdrops);
   });

   loadingBlocks.forEach(block => block.remove());
});

async function fetchCategoryData(categoryId, categoryElement, usedBackdrops) {
   try {
      const isMovieCategory = categories.common.some(c => c.id === categoryId) ||
         (categories.genreMap[categoryId] && categories.genreMap[categoryId].some(id => id < 10000));

      const isTVCategory = categories.extras.some(c => c.id === categoryId) ||
         (categories.genreMap[categoryId] && categories.genreMap[categoryId].some(id => id >= 10000));

      let movieResults = [];
      let tvResults = [];
      let totalResults = 0;

      if (isMovieCategory) {
         const movieResponse = await fetch(`${api.url}${endpoints.discover.movie}?api_key=${api.key}&with_genres=${categoryId}&page=1&sort_by=popularity.desc`);
         const movieData = await movieResponse.json();

         if (movieData.results) {
            movieResults = movieData.results;
            totalResults += movieData.total_results || 0;
         }
      }

      if (isTVCategory) {
         let tvGenreId = categoryId;
         if (categories.genreMap[categoryId] && categories.genreMap[categoryId].some(id => id >= 10000)) {
            tvGenreId = categories.genreMap[categoryId].find(id => id >= 10000) || categoryId;
         }

         const tvResponse = await fetch(`${api.url}${endpoints.discover.show}?api_key=${api.key}&with_genres=${tvGenreId}&page=1&sort_by=popularity.desc`);
         const tvData = await tvResponse.json();

         if (tvData.results) {
            tvResults = tvData.results;
            totalResults += tvData.total_results || 0;
         }
      }

      const countElement = categoryElement.querySelector('.category__value');
      countElement.textContent = totalResults || 0;

      const allResults = [...movieResults, ...tvResults].sort((a, b) => b.popularity - a.popularity);

      if (allResults.length > 0) {
         let selectedItem = null;

         for (const item of allResults) {
            if (item.backdrop_path && !usedBackdrops.has(item.backdrop_path)) {
               selectedItem = item;
               usedBackdrops.add(item.backdrop_path);
               break;
            }
         }

         if (!selectedItem) {
            selectedItem = allResults.find(item => item.backdrop_path);
         }

         if (selectedItem && selectedItem.backdrop_path) {
            const imgElement = categoryElement.querySelector('.category__cover img');
            imgElement.src = `${api.img}${selectedItem.backdrop_path}`;

            imgElement.style.opacity = 0;
            imgElement.onload = () => {
               imgElement.style.transition = 'opacity 0.5s ease';
               imgElement.style.opacity = 1;
            };
         }
      }
   } catch (error) {
      console.error(`Error fetching data for category ${categoryId}:`, error);
      const countElement = categoryElement.querySelector('.category__value');
      countElement.textContent = 0;
   }
}
