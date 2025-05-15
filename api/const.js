const api = {
   key: "34a90711751115d4892bd58691b55397",
   url: "https://api.themoviedb.org/3",
   img: "https://image.tmdb.org/t/p/w500",
}

const endpoints = {
   movies: {
      now_playing: "/movie/now_playing",
      popular: "/movie/popular",
      top_rated: "/movie/top_rated",
      upcoming: "/movie/upcoming",
   },
   shows: {
      now_playing: "/tv/on_the_air",
      popular: "/tv/popular",
      top_rated: "/tv/top_rated",
      upcoming: "/tv/airing_today",
   },
   genres: {
      movies: "/genre/movie/list",
      shows: "/genre/tv/list",
   },
   details: {
      movie: "/movie/",
      show: "/tv/",
   },
   search: {
      movie: "/search/movie",
      show: "/search/tv",
      multi: "/search/multi",
   },
   discover: {
      movie: "/discover/movie",
      show: "/discover/tv",
   },
};

const categories = {
   common: [
      { id: 28, name: "Action" },
      { id: 12, name: "Adventure" },
      { id: 16, name: "Animation" },
      { id: 35, name: "Comedy" },
      { id: 80, name: "Crime" },
      { id: 99, name: "Documentary" },
      { id: 18, name: "Drama" },
      { id: 10751, name: "Family" },
      { id: 14, name: "Fantasy" },
      { id: 36, name: "History" },
      { id: 27, name: "Horror" },
      { id: 10402, name: "Music" },
      { id: 9648, name: "Mystery" },
      { id: 10749, name: "Romance" },
      { id: 878, name: "Science Fiction" },
      { id: 10770, name: "TV Movie" },
      { id: 53, name: "Thriller" },
      { id: 10752, name: "War" },
      { id: 37, name: "Western" }
   ],
   extras: [
      { "id": 10759, "name": "Action" },
      { "id": 10759, "name": "Adventure" },
      { "id": 10762, "name": "Kids" },
      { "id": 10763, "name": "News" },
      { "id": 10764, "name": "Reality" },
      { "id": 10765, "name": "Science Fiction" },
      { "id": 10765, "name": "Fantasy" },
      { "id": 10766, "name": "Soap" },
      { "id": 10767, "name": "Talk" },
      { "id": 10768, "name": "War" },
      { "id": 10768, "name": "Politics" }
   ],
   genreMap: {
      "28": [28, 10759],
      "12": [12, 10759],
      "16": [16],
      "35": [35],
      "80": [80],
      "99": [99],
      "18": [18],
      "10751": [10751],
      "14": [14, 10765],
      "36": [36],
      "27": [27],
      "10402": [10402],
      "9648": [9648, 10765],
      "10749": [10749],
      "878": [878, 10765],
      "10770": [10770],
      "53": [53],
      "10752": [10752, 10768],
      "37": [37],
      "10759": [28, 12],
      "10762": [10762],
      "10763": [10763],
      "10764": [10764],
      "10765": [14, 878],
      "10766": [10766],
      "10767": [10767],
   }
}

export { api, endpoints, categories };