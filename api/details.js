import { api, endpoints } from "./const.js";

document.addEventListener('DOMContentLoaded', () => {
   const urlParams = new URLSearchParams(window.location.search);
   const mediaType = urlParams.get('media_type') || 'movie';
   const id = urlParams.get('id');

   if (!id) {
      window.location.href = "index.html";
      return;
   }

   fetchDetails(mediaType, id);
   setupVideoPlayer(mediaType, id);
   fetchReviews(mediaType, id);
});

async function fetchDetails(mediaType, id) {
   try {
      const detailsEndpoint = mediaType === 'movie'
         ? `${api.url}${endpoints.details.movie}${id}?api_key=${api.key}&append_to_response=videos`
         : `${api.url}${endpoints.details.show}${id}?api_key=${api.key}&append_to_response=videos`;

      const response = await fetch(detailsEndpoint);
      const data = await response.json();

      if (!response.ok) {
         throw new Error('Failed to fetch details');
      }

      updatePageContent(data, mediaType);
      updateTrailer(data.videos);
      updateGenres(data.genres, mediaType);
   } catch (error) {
      console.error('Error fetching details:', error);
      displayError();
   }
}

async function fetchReviews(mediaType, id) {
   try {
      const reviewsEndpoint = `${api.url}/${mediaType}/${id}/reviews?api_key=${api.key}`;
      const reviewsResponse = await fetch(reviewsEndpoint);
      const reviewsData = await reviewsResponse.json();

      if (!reviewsResponse.ok) {
         throw new Error('Failed to fetch reviews');
      }

      updateReviews(reviewsData.results);

      const reviewsCountElement = document.querySelector('a[href="#tab-2"] span');
      if (reviewsCountElement) {
         reviewsCountElement.textContent = reviewsData.results.length;
      }

      updateComments(reviewsData.results);

      const commentsCountElement = document.querySelector('a[href="#tab-1"] span');
      if (commentsCountElement) {
         commentsCountElement.textContent = reviewsData.results.length;
      }
   } catch (error) {
      console.error('Error fetching reviews:', error);
   }
}

function updatePageContent(data, mediaType) {
   const titleElement = document.querySelector('.article__content h1');
   if (titleElement) {
      titleElement.textContent = data.title || data.name;
   }

   document.title = `${data.title || data.name} - FlixTV`;

   const listItems = document.querySelectorAll('.list li');
   if (listItems.length > 0) {
      const ratingElement = listItems[0];
      const rating = data.vote_average ? data.vote_average.toFixed(1) : '0.0';
      const svgContent = ratingElement.innerHTML.split('</svg>')[0] + '</svg>';
      ratingElement.innerHTML = svgContent + ' ' + rating;
   }

   if (listItems.length > 1 && data.genres && data.genres.length > 0) {
      listItems[1].textContent = data.genres[0].name;
   }

   if (listItems.length > 2) {
      const year = mediaType === 'movie'
         ? (data.release_date ? data.release_date.substring(0, 4) : 'N/A')
         : (data.first_air_date ? data.first_air_date.substring(0, 4) : 'N/A');
      listItems[2].textContent = year;
   }

   if (listItems.length > 3) {
      let runtime = 'N/A';
      if (mediaType === 'movie' && data.runtime) {
         const hours = Math.floor(data.runtime / 60);
         const minutes = data.runtime % 60;
         runtime = `${hours} h ${minutes} min`;
      } else if (mediaType === 'tv' && data.episode_run_time && data.episode_run_time.length > 0) {
         const hours = Math.floor(data.episode_run_time[0] / 60);
         const minutes = data.episode_run_time[0] % 60;
         runtime = `${hours} h ${minutes} min`;
      }
      listItems[3].textContent = runtime;
   }

   if (listItems.length > 4) {
      listItems[4].textContent = data.adult ? '18+' : '13+';
   }

   const descriptionElement = document.querySelector('.article__content p');
   if (descriptionElement) {
      descriptionElement.textContent = data.overview || 'No description available.';
   }

   if (data.backdrop_path) {
      const bgElement = document.querySelector('.section__bg');
      if (bgElement) {
         bgElement.style.backgroundImage = `url(${api.img}${data.backdrop_path})`;
      }
   }
}

function updateTrailer(videos) {
   if (!videos || !videos.results || videos.results.length === 0) {
      return;
   }

   const trailer = videos.results.find(video =>
      video.type === 'Trailer' && video.site === 'YouTube'
   ) || videos.results[0];

   if (trailer && trailer.key) {
      const trailerLink = document.querySelector('.article__trailer');
      if (trailerLink) {
         trailerLink.href = `http://www.youtube.com/watch?v=${trailer.key}`;
      }
   }
}

function updateGenres(genres, mediaType) {
   if (!genres || genres.length === 0) {
      return;
   }

   const categoriesContainer = document.querySelector('.categories');
   if (!categoriesContainer) {
      return;
   }

   const title = categoriesContainer.querySelector('.categories__title');
   categoriesContainer.innerHTML = '';
   categoriesContainer.appendChild(title);

   genres.forEach(genre => {
      const genreLink = document.createElement('a');
      genreLink.href = `search.html?genre=${genre.id}&media_type=${mediaType}`;
      genreLink.className = 'categories__item';
      genreLink.textContent = genre.name;
      categoriesContainer.appendChild(genreLink);
   });
}

function updateComments(reviews) {
   const commentsContainer = document.querySelector('#tab-1 .comments__list');
   if (!commentsContainer) {
      return;
   }

   commentsContainer.innerHTML = '';

   if (reviews.length === 0) {
      const noCommentsItem = document.createElement('li');
      noCommentsItem.className = 'comments__item';
      noCommentsItem.innerHTML = '<p class="comments__text">No comments available for this title.</p>';
      commentsContainer.appendChild(noCommentsItem);
      return;
   }

   reviews.forEach(review => {
      const commentItem = document.createElement('li');
      commentItem.className = 'comments__item';

      const reviewDate = new Date(review.created_at);
      const formattedDate = reviewDate.toLocaleDateString('en-US', {
         day: '2-digit',
         month: '2-digit',
         year: 'numeric'
      }) + ', ' + reviewDate.toLocaleTimeString('en-US', {
         hour: '2-digit',
         minute: '2-digit',
         hour12: false
      });


      const authorName = review.author || 'Anonymous';
      const avatarPath = review.author_details && review.author_details.avatar_path
         ? (review.author_details.avatar_path.startsWith('/http')
            ? review.author_details.avatar_path.substring(1)
            : `${api.img}${review.author_details.avatar_path}`)
         : 'img/avatar.svg';

      commentItem.innerHTML = `
         <div class="comments__autor">
            <img class="comments__avatar" src="${avatarPath}" alt="${authorName}">
            <span class="comments__name">${authorName}</span>
            <span class="comments__time">${formattedDate}</span>
         </div>
         <p class="comments__text">${review.content}</p>
      `;

      commentsContainer.appendChild(commentItem);
   });
}

function updateReviews(reviews) {
   const reviewsContainer = document.querySelector('#tab-2 .reviews__list');
   if (!reviewsContainer) {
      return;
   }

   reviewsContainer.innerHTML = '';

   if (reviews.length === 0) {
      const noReviewsItem = document.createElement('li');
      noReviewsItem.className = 'reviews__item';
      noReviewsItem.innerHTML = '<p class="reviews__text">No reviews available for this title.</p>';
      reviewsContainer.appendChild(noReviewsItem);
      return;
   }

   reviews.forEach(review => {
      const reviewItem = document.createElement('li');
      reviewItem.className = 'reviews__item';

      const reviewDate = new Date(review.created_at);
      const formattedDate = reviewDate.toLocaleDateString('en-US', {
         day: '2-digit',
         month: '2-digit',
         year: 'numeric'
      }) + ', ' + reviewDate.toLocaleTimeString('en-US', {
         hour: '2-digit',
         minute: '2-digit',
         hour12: false
      });

      const authorName = review.author || 'Anonymous';
      const avatarPath = review.author_details && review.author_details.avatar_path
         ? (review.author_details.avatar_path.startsWith('/http')
            ? review.author_details.avatar_path.substring(1)
            : `${api.img}${review.author_details.avatar_path}`)
         : 'img/avatar.svg';
      const rating = review.author_details && review.author_details.rating
         ? review.author_details.rating
         : 'N/A';

      reviewItem.innerHTML = `
         <div class="reviews__autor">
            <img class="reviews__avatar" src="${avatarPath}" alt="${authorName}">
            <span class="reviews__name">${review.content.substring(0, 50)}${review.content.length > 50 ? '...' : ''}</span>
            <span class="reviews__time">${formattedDate} by ${authorName}</span>
            <span class="reviews__rating"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
               <path d="M22,9.67A1,1,0,0,0,21.14,9l-5.69-.83L12.9,3a1,1,0,0,0-1.8,0L8.55,8.16,2.86,9a1,1,0,0,0-.81.68,1,1,0,0,0,.25,1l4.13,4-1,5.68A1,1,0,0,0,6.9,21.44L12,18.77l5.1,2.67a.93.93,0,0,0,.46.12,1,1,0,0,0,.59-.19,1,1,0,0,0,.4-1l-1-5.68,4.13-4A1,1,0,0,0,22,9.67Zm-6.15,4a1,1,0,0,0-.29.88l.72,4.2-3.76-2a1.06,1.06,0,0,0-.94,0l-3.76,2,.72-4.2a1,1,0,0,0-.29-.88l-3-3,4.21-.61a1,1,0,0,0,.76-.55L12,5.7l1.88,3.82a1,1,0,0,0,.76.55l4.21.61Z" />
            </svg> ${rating}</span>
         </div>
         <p class="reviews__text">${review.content}</p>
      `;

      reviewsContainer.appendChild(reviewItem);
   });
}

function setupVideoPlayer(mediaType, id) {
   const playerIframe = document.getElementById('player');
   if (playerIframe) {
      const embedType = mediaType === 'movie' ? 'movie' : 'tv';
      playerIframe.src = `https://vidsrcme.su/embed/${embedType}/${id}`;
   }
}

function displayError() {
   const container = document.querySelector('.article__content');
   if (container) {
      container.innerHTML = `
            <h1>Content Not Found</h1>
            <p>Sorry, we couldn't find the requested content. Please try again or return to the homepage.</p>
            <a href="index.html" class="btn btn--primary">Back to Home</a>
        `;
   }
}
