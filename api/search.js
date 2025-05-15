
import { api, endpoints, categories } from "./const.js";

document.addEventListener('DOMContentLoaded', () => {
   const urlParams = new URLSearchParams(window.location.search);
   const param = urlParams.get('param');
   const keywords = urlParams.get('keywords');
   const genre = urlParams.get('genre');
   const page = parseInt(urlParams.get('page') || '1', 10);

   if (!param && !keywords && !genre) {
      window.location.href = "index.html";
      return;
   }

   updatePageTitle(param, keywords, genre);

   if (keywords) {
      searchByKeywords(keywords, page);
   } else if (genre) {
      searchByGenre(genre, page);
   } else if (param) {
      searchByParam(param, page);
   }
});

function updatePageTitle(param, keywords, genre) {
   const titleElement = document.querySelector('.section__title.section__title--head');
   if (!titleElement) return;

   if (keywords) {
      titleElement.textContent = `Search Results for "${keywords}"`;
   } else if (genre) {
      const genreId = parseInt(genre, 10);
      const genreObj = categories.common.find(cat => cat.id === genreId) ||
         categories.extras.find(cat => cat.id === genreId);
      titleElement.textContent = genreObj ? `Genre: ${genreObj.name}` : 'Genre Results';
   } else if (param) {
      switch (param) {
         case 'now_playing_movies':
            titleElement.textContent = 'Now Playing Movies';
            break;
         case 'popular_movies':
            titleElement.textContent = 'Popular Movies';
            break;
         case 'top_rated_movies':
            titleElement.textContent = 'Top Rated Movies';
            break;
         case 'upcoming_movies':
            titleElement.textContent = 'Upcoming Movies';
            break;
         case 'now_playing_shows':
            titleElement.textContent = 'Now Playing TV Shows';
            break;
         case 'popular_shows':
            titleElement.textContent = 'Popular TV Shows';
            break;
         case 'top_rated_shows':
            titleElement.textContent = 'Top Rated TV Shows';
            break;
         case 'upcoming_shows':
            titleElement.textContent = 'Upcoming TV Shows';
            break;
         default:
            titleElement.textContent = 'Search Results';
      }
   }
}

async function searchByKeywords(keywords, page) {
   try {
      const response = await fetch(`${api.url}${endpoints.search.multi}?api_key=${api.key}&query=${encodeURIComponent(keywords)}&page=${page}`);
      const data = await response.json();

      if (data.results && data.results.length > 0) {
         displayResults(data.results, null, page, data.total_pages);
         updatePagination(page, data.total_pages, { keywords });
      } else {
         displayNoResults();
         updatePagination(1, 0, { keywords });
      }
   } catch (error) {
      console.error('Error searching by keywords:', error);
      displayNoResults();
      updatePagination(1, 0, { keywords });
   }
}

async function searchByGenre(genreId, page) {
   try {
      const movieGenreId = parseInt(genreId, 10);
      let tvGenreIds = [];

      if (categories.genreMap[genreId]) {
         tvGenreIds = categories.genreMap[genreId].filter(id => id >= 10000);
      }

      const movieResponse = await fetch(`${api.url}${endpoints.discover.movie}?api_key=${api.key}&with_genres=${movieGenreId}&page=${page}`);
      const movieData = await movieResponse.json();

      let tvPromises = [];
      let tvResults = [];

      if (tvGenreIds.length > 0) {
         tvPromises = tvGenreIds.map(tvId =>
            fetch(`${api.url}${endpoints.discover.show}?api_key=${api.key}&with_genres=${tvId}&page=${page}`)
               .then(response => response.json())
         );
      } else {
         tvPromises.push(
            fetch(`${api.url}${endpoints.discover.show}?api_key=${api.key}&with_genres=${movieGenreId}&page=${page}`)
               .then(response => response.json())
         );
      }

      const tvResponses = await Promise.all(tvPromises);

      tvResponses.forEach(tvData => {
         if (tvData.results) {
            tvResults = [...tvResults, ...tvData.results];
         }
      });

      const movieResults = movieData.results ? movieData.results.map(item => ({ ...item, media_type: 'movie' })) : [];
      const mappedTvResults = tvResults.map(item => ({ ...item, media_type: 'tv' }));

      const combinedResults = [...movieResults, ...mappedTvResults]
         .sort((a, b) => b.popularity - a.popularity)
         .filter((item, index, self) =>
            index === self.findIndex(t => t.id === item.id && t.media_type === item.media_type)
         );

      const totalPages = Math.max(movieData.total_pages || 0, ...tvResponses.map(r => r.total_pages || 0));

      if (combinedResults.length > 0) {
         displayResults(combinedResults, parseInt(genreId, 10), page, totalPages);
         updatePagination(page, totalPages, { genre: genreId });
      } else {
         displayNoResults();
         updatePagination(1, 0, { genre: genreId });
      }
   } catch (error) {
      console.error('Error searching by genre:', error);
      displayNoResults();
      updatePagination(1, 0, { genre: genreId });
   }
}

async function searchByParam(param, page) {
   try {
      let endpoint = '';
      let mediaType = '';

      if (param.includes('movies')) {
         mediaType = 'movie';
         if (param.includes('now_playing')) {
            endpoint = endpoints.movies.now_playing;
         } else if (param.includes('popular')) {
            endpoint = endpoints.movies.popular;
         } else if (param.includes('top_rated')) {
            endpoint = endpoints.movies.top_rated;
         } else if (param.includes('upcoming')) {
            endpoint = endpoints.movies.upcoming;
         }
      } else if (param.includes('shows')) {
         mediaType = 'tv';
         if (param.includes('now_playing')) {
            endpoint = endpoints.shows.now_playing;
         } else if (param.includes('popular')) {
            endpoint = endpoints.shows.popular;
         } else if (param.includes('top_rated')) {
            endpoint = endpoints.shows.top_rated;
         } else if (param.includes('upcoming')) {
            endpoint = endpoints.shows.upcoming;
         }
      }

      if (endpoint) {
         const response = await fetch(`${api.url}${endpoint}?api_key=${api.key}&page=${page}`);
         const data = await response.json();

         if (data.results && data.results.length > 0) {
            const results = data.results.map(item => ({
               ...item,
               media_type: mediaType
            }));
            displayResults(results, null, page, data.total_pages);
            updatePagination(page, data.total_pages, { param });
         } else {
            displayNoResults();
            updatePagination(1, 0, { param });
         }
      } else {
         displayNoResults();
         updatePagination(1, 0, { param });
      }
   } catch (error) {
      console.error('Error searching by param:', error);
      displayNoResults();
      updatePagination(1, 0, { param });
   }
}

function displayResults(results, highlightedGenreId = null, currentPage, totalPages) {
   const container = document.querySelector('.row--grid');
   if (!container) return;

   container.innerHTML = '';

   results.forEach(item => {
      if (item.media_type === 'person') return;

      const posterPath = item.poster_path
         ? `${api.img}${item.poster_path}`
         : 'img/card/poster.jpg';

      const rating = item.vote_average ? item.vote_average.toFixed(1) : '0.0';

      const mediaType = item.media_type === 'tv' ? 'TV' : 'Movie';

      let year = '';
      if (item.media_type === 'movie' && item.release_date) {
         year = item.release_date.substring(0, 4);
      } else if (item.media_type === 'tv' && item.first_air_date) {
         year = item.first_air_date.substring(0, 4);
      }

      let genreName = 'Unknown';

      if (highlightedGenreId) {
         const genreObj = categories.common.find(cat => cat.id === highlightedGenreId) ||
            categories.extras.find(cat => cat.id === highlightedGenreId);
         genreName = genreObj ? genreObj.name : 'Unknown';
      } else if (item.genre_ids && item.genre_ids.length > 0) {
         const genre = categories.common.find(cat => cat.id === item.genre_ids[0]) ||
            categories.extras.find(cat => cat.id === item.genre_ids[0]);
         genreName = genre ? genre.name : 'Unknown';
      }

      const cardElement = document.createElement('div');
      cardElement.className = 'col-6 col-sm-4 col-lg-3 col-xl-2';
      cardElement.innerHTML = `
         <div class="card">
            <a href="details.html?id=${item.id}&media_type=${item.media_type}" class="card__cover">
               <img src="${posterPath}" alt="${item.title || item.name}" loading="lazy">
               <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M11 1C16.5228 1 21 5.47716 21 11C21 16.5228 16.5228 21 11 21C5.47716 21 1 16.5228 1 11C1 5.47716 5.47716 1 11 1Z" stroke-linecap="round" stroke-linejoin="round" />
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M14.0501 11.4669C13.3211 12.2529 11.3371 13.5829 10.3221 14.0099C10.1601 14.0779 9.74711 14.2219 9.65811 14.2239C9.46911 14.2299 9.28711 14.1239 9.19911 13.9539C9.16511 13.8879 9.06511 13.4569 9.03311 13.2649C8.93811 12.6809 8.88911 11.7739 8.89011 10.8619C8.88911 9.90489 8.94211 8.95489 9.04811 8.37689C9.07611 8.22089 9.15811 7.86189 9.18211 7.80389C9.22711 7.69589 9.30911 7.61089 9.40811 7.55789C9.48411 7.51689 9.57111 7.49489 9.65811 7.49789C9.74711 7.49989 10.1091 7.62689 10.2331 7.67589C11.2111 8.05589 13.2801 9.43389 14.0401 10.2439C14.1081 10.3169 14.2951 10.5129 14.3261 10.5529C14.3971 10.6429 14.4321 10.7519 14.4321 10.8619C14.4321 10.9639 14.4011 11.0679 14.3371 11.1549C14.3041 11.1999 14.1131 11.3999 14.0501 11.4669Z" stroke-linecap="round" stroke-linejoin="round" />
               </svg>
            </a>
            <span class="card__rating">
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d="M22,9.67A1,1,0,0,0,21.14,9l-5.69-.83L12.9,3a1,1,0,0,0-1.8,0L8.55,8.16,2.86,9a1,1,0,0,0-.81.68,1,1,0,0,0,.25,1l4.13,4-1,5.68A1,1,0,0,0,6.9,21.44L12,18.77l5.1,2.67a.93.93,0,0,0,.46.12,1,1,0,0,0,.59-.19,1,1,0,0,0,.4-1l-1-5.68,4.13-4A1,1,0,0,0,22,9.67Zm-6.15,4a1,1,0,0,0-.29.88l.72,4.2-3.76-2a1.06,1.06,0,0,0-.94,0l-3.76,2,.72-4.2a1,1,0,0,0-.29-.88l-3-3,4.21-.61a1,1,0,0,0,.76-.55L12,5.7l1.88,3.82a1,1,0,0,0,.76.55l4.21.61Z" />
               </svg> ${rating}</span>
            <h3 class="card__title"><a href="details.html?id=${item.id}&media_type=${item.media_type}">${item.title || item.name}</a></h3>
            <ul class="card__list">
               <li>${mediaType}</li>
               <li>${genreName}</li>
               ${year ? `<li>${year}</li>` : ''}
            </ul>
         </div>
      `;

      container.appendChild(cardElement);
   });

   updateResultCount(results.length, currentPage, totalPages);
}

function displayNoResults() {
   const container = document.querySelector('.row--grid');
   if (!container) return;

   container.innerHTML = `
      <div class="col-12">
         <div class="section__wrap">
            <div class="section__not-found">
               <h2>No results found</h2>
               <p>Try different search terms or browse our categories</p>
            </div>
         </div>
      </div>
   `;

   updateResultCount(0, 1, 0);
}

function updateResultCount(resultCount, currentPage, totalPages) {
   const countElement = document.querySelector('.catalog__pages');
   if (!countElement) return;

   if (resultCount === 0) {
      countElement.textContent = 'No results found';
   } else {
      const itemsPerPage = 20;
      const totalItems = totalPages * itemsPerPage;

      countElement.textContent = `Page ${currentPage} of ${totalPages} (${totalItems} items)`;
   }
}

function updatePagination(currentPage, totalPages, params) {
   const paginationElement = document.querySelector('.catalog__paginator');
   if (!paginationElement) return;

   paginationElement.innerHTML = '';

   if (totalPages === 0) {
      addPaginationItem(paginationElement, 'prev', true);
      addPaginationItem(paginationElement, 'next', true);
      return;
   }

   const maxVisiblePages = 5;
   let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
   let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

   if (endPage - startPage + 1 < maxVisiblePages && startPage > 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
   }

   const prevDisabled = currentPage === 1;
   const nextDisabled = currentPage === totalPages;

   addPaginationItem(paginationElement, 'prev', prevDisabled, currentPage - 1, params);

   for (let i = startPage; i <= endPage; i++) {
      const isActive = i === currentPage;
      addPaginationItem(paginationElement, i, false, i, params, isActive);
   }

   addPaginationItem(paginationElement, 'next', nextDisabled, currentPage + 1, params);
}

function addPaginationItem(container, label, disabled, pageNum, params, isActive = false) {
   const li = document.createElement('li');
   if (isActive) {
      li.className = 'active';
   }

   let url = '#';
   if (!disabled && pageNum) {
      url = createPageUrl(pageNum, params);
   }

   let content = '';
   if (label === 'prev') {
      content = `
         <svg width="14" height="11" viewBox="0 0 14 11" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0.75 5.36475L13.1992 5.36475" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M5.771 10.1271L0.749878 5.36496L5.771 0.602051" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
         </svg>
      `;
   } else if (label === 'next') {
      content = `
         <svg width="14" height="11" viewBox="0 0 14 11" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13.1992 5.3645L0.75 5.3645" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M8.17822 0.602051L13.1993 5.36417L8.17822 10.1271" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
         </svg>
      `;
   } else {
      content = label;
   }

   li.innerHTML = `<a href="${url}" ${disabled ? 'class="disabled"' : ''}>${content}</a>`;

   if (disabled) {
      li.querySelector('a').addEventListener('click', (e) => {
         e.preventDefault();
      });
   }

   container.appendChild(li);
}

function createPageUrl(page, params) {
   const url = new URL(window.location.href);
   url.searchParams.set('page', page);

   return url.toString();
}
