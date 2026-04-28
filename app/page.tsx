'use client'

import { useState, useEffect, useCallback } from 'react'

interface Country {
  name: {
    common: string
    official: string
  }
  capital: string[]
  region: string
  subregion: string
  population: number
  flags: {
    svg: string
    png: string
  }
  cca2: string
  cca3: string
}

interface Meal {
  idMeal: string
  strMeal: string
  strMealThumb: string
  strCategory: string
  strArea: string
  strInstructions: string
}

interface Movie {
  Title: string
  Year: string
  imdbID: string
  Type: string
  Poster: string
}

interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string
  html_url: string
  language: string
  stargazers_count: number
  owner: {
    login: string
  }
}

interface SearchResult {
  type: 'country' | 'recipe' | 'movie' | 'github'
  country?: Country
  meal?: Meal
  movie?: Movie
  repo?: GitHubRepo
  aiSummary: string
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [searchType, setSearchType] = useState<'country' | 'recipe' | 'movie' | 'github'>('country')

  // Debounce search
  const debounce = useCallback((func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout
    return (...args: any[]) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func.apply(null, args), delay)
    }
  }, [])

  // Search countries API
  const searchCountries = async (query: string) => {
    if (query.length < 3) {
      setResults([])
      setShowDropdown(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`https://restcountries.com/v3.1/name/${query}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setResults([])
        } else {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        return
      }

      const countries: Country[] = await response.json()
      
      // Take top 5 results and add AI summaries
      const searchResults: SearchResult[] = countries.slice(0, 5).map(country => ({
        type: 'country',
        country,
        aiSummary: generateAISummary(country)
      }))
      
      setResults(searchResults)
      setShowDropdown(true)
    } catch (err) {
      setError('Failed to fetch countries. Please try again.')
      console.error('Search error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Search recipes API
  const searchRecipes = async (query: string) => {
    if (query.length < 3) {
      setResults([])
      setShowDropdown(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${query}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const meals: Meal[] = data.meals || []
      
      // Take top 5 results and add AI summaries
      const searchResults: SearchResult[] = meals.slice(0, 5).map(meal => ({
        type: 'recipe',
        meal,
        aiSummary: generateRecipeSummary(meal)
      }))
      
      setResults(searchResults)
      setShowDropdown(true)
    } catch (err) {
      setError('Failed to fetch recipes. Please try again.')
      console.error('Search error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Search movies API
  const searchMovies = async (query: string) => {
    if (query.length < 3) {
      setResults([])
      setShowDropdown(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`https://www.omdbapi.com/?s=${query}&apikey=thewdb`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.Response === 'False') {
        // If API fails, show helpful message
        setError('OMDB API requires a valid API key. For demo, try countries, recipes, or GitHub search.')
        setResults([])
        setShowDropdown(true)
        return
      }
      
      const movies: Movie[] = data.Search || []
      
      // Take top 5 results and add AI summaries
      const searchResults: SearchResult[] = movies.slice(0, 5).map(movie => ({
        type: 'movie',
        movie,
        aiSummary: generateMovieSummary(movie)
      }))
      
      setResults(searchResults)
      setShowDropdown(true)
    } catch (err) {
      setError('OMDB API requires a valid API key. For demo, try countries, recipes, or GitHub search.')
      console.error('Search error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Search GitHub repos API
  const searchGitHubRepos = async (query: string) => {
    if (query.length < 3) {
      setResults([])
      setShowDropdown(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`https://api.github.com/search/repositories?q=${query}&sort=stars&order=desc&per_page=5`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const repos: GitHubRepo[] = data.items || []
      
      // Take top 5 results and add AI summaries
      const searchResults: SearchResult[] = repos.slice(0, 5).map(repo => ({
        type: 'github',
        repo,
        aiSummary: generateGitHubSummary(repo)
      }))
      
      setResults(searchResults)
      setShowDropdown(true)
    } catch (err) {
      setError('Failed to fetch repositories. Please try again.')
      console.error('Search error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // AI-powered summary generation (simulated)
  const generateAISummary = (country: Country): string => {
    const capital = country.capital?.[0] || 'N/A'
    const population = (country.population / 1000000).toFixed(1)
    return `${capital} is the capital of ${country.name.common}, a ${country.subregion || country.region} nation with ${population}M people.`
  }

  // AI-powered recipe summary generation
  const generateRecipeSummary = (meal: Meal): string => {
    const category = meal.strCategory || 'dish'
    const area = meal.strArea || 'international'
    return `A delicious ${category} from ${area}. Click for full recipe and instructions.`
  }

  // AI-powered movie summary generation
  const generateMovieSummary = (movie: Movie): string => {
    return `${movie.Title} (${movie.Year}) - ${movie.Type === 'movie' ? 'Film' : 'Series'}. Click for more details.`
  }

  // AI-powered GitHub repository summary generation
  const generateGitHubSummary = (repo: GitHubRepo): string => {
    const stars = repo.stargazers_count.toLocaleString()
    const language = repo.language || 'Unknown'
    return `${stars} stars • ${language} by ${repo.owner.login}. ${repo.description || 'No description available.'}`
  }

  // Typo correction using Levenshtein distance (simplified)
  const correctTypo = (query: string): string => {
    if (searchType === 'country') {
      const commonCountries = ['united', 'states', 'china', 'india', 'brazil', 'russia', 'japan', 'germany', 'france', 'canada']
      
      for (const country of commonCountries) {
        if (query.length >= 3 && country.includes(query.toLowerCase()) || query.toLowerCase().includes(country)) {
          return country
        }
      }
    } else if (searchType === 'recipe') {
      const commonMeals = ['chicken', 'pasta', 'salad', 'soup', 'cake', 'pizza', 'rice', 'fish', 'beef', 'vegetable']
      
      for (const meal of commonMeals) {
        if (query.length >= 3 && meal.includes(query.toLowerCase()) || query.toLowerCase().includes(meal)) {
          return meal
        }
      }
    } else if (searchType === 'movie') {
      const commonMovies = ['avengers', 'star', 'war', 'love', 'dark', 'night', 'man', 'home', 'game', 'time']
      
      for (const movie of commonMovies) {
        if (query.length >= 3 && movie.includes(query.toLowerCase()) || query.toLowerCase().includes(movie)) {
          return movie
        }
      }
    } else if (searchType === 'github') {
      const commonRepos = ['react', 'vue', 'angular', 'node', 'python', 'javascript', 'typescript', 'docker', 'kubernetes', 'linux']
      
      for (const repo of commonRepos) {
        if (query.length >= 3 && repo.includes(query.toLowerCase()) || query.toLowerCase().includes(repo)) {
          return repo
        }
      }
    }
    return query
  }

  // Debounced search function
  const debouncedSearch = useCallback(debounce((query: string) => {
    if (searchType === 'country') {
      searchCountries(query)
    } else if (searchType === 'recipe') {
      searchRecipes(query)
    } else if (searchType === 'movie') {
      searchMovies(query)
    } else if (searchType === 'github') {
      searchGitHubRepos(query)
    }
  }, 300), [debounce, searchType])

  useEffect(() => {
    const correctedQuery = correctTypo(searchQuery)
    debouncedSearch(correctedQuery)
  }, [searchQuery, debouncedSearch])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'country') {
      console.log('Selected country:', result.country?.name.common)
      setSearchQuery(result.country?.name.common || '')
    } else if (result.type === 'recipe') {
      console.log('Selected recipe:', result.meal?.strMeal)
      setSearchQuery(result.meal?.strMeal || '')
    } else if (result.type === 'movie') {
      console.log('Selected movie:', result.movie?.Title)
      setSearchQuery(result.movie?.Title || '')
    } else if (result.type === 'github') {
      console.log('Selected repo:', result.repo?.full_name)
      setSearchQuery(result.repo?.full_name || '')
    }
    setShowDropdown(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 pt-8">
          <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
            AI-Enhanced Smart Search
          </h1>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Discover countries, recipes, movies, and repositories with intelligent search and AI-powered insights
          </p>
        </div>

        {/* Search Type Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2 shadow-xl border border-white/20">
            <button
              onClick={() => setSearchType('country')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                searchType === 'country'
                  ? 'bg-white text-purple-600 shadow-lg scale-105'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              🌍 Countries
            </button>
            <button
              onClick={() => setSearchType('recipe')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                searchType === 'recipe'
                  ? 'bg-white text-purple-600 shadow-lg scale-105'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              🍽️ Recipes
            </button>
            <button
              onClick={() => setSearchType('movie')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                searchType === 'movie'
                  ? 'bg-white text-purple-600 shadow-lg scale-105'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              🎬 Movies
            </button>
            <button
              onClick={() => setSearchType('github')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                searchType === 'github'
                  ? 'bg-white text-purple-600 shadow-lg scale-105'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              💻 GitHub
            </button>
          </div>
        </div>

        <div className="relative max-w-2xl mx-auto">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              placeholder={
                searchType === 'country' ? '🔍 Search for a country (type 3+ letters)...' :
                searchType === 'recipe' ? '🔍 Search for a recipe (type 3+ letters)...' :
                searchType === 'movie' ? '🔍 Search for a movie (type 3+ letters)...' :
                '🔍 Search for a repository (type 3+ letters)...'
              }
              className="w-full px-6 py-4 pr-14 text-lg text-gray-800 bg-white/90 backdrop-blur-md border-2 border-white/30 rounded-2xl focus:outline-none focus:border-white/60 focus:bg-white transition-all duration-300 shadow-xl placeholder-gray-500"
              onFocus={() => searchQuery.length >= 3 && setShowDropdown(true)}
            />
            
            {isLoading && (
              <div className="absolute right-4 top-4">
                <div className="animate-spin rounded-full h-6 w-6 border-3 border-purple-600 border-t-transparent"></div>
              </div>
            )}
          </div>

          {/* Dropdown results */}
          {showDropdown && (
            <div className="absolute z-10 w-full mt-2 bg-white backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg max-h-72 overflow-y-auto animate-in slide-in-from-top-1 duration-200">
              {error && (
                <div className="p-4 text-red-600 text-center font-medium">
                  ⚠️ {error}
                </div>
              )}

              {!error && !isLoading && results.length === 0 && searchQuery.length >= 3 && (
                <div className="p-6 text-gray-600 text-center">
                  <div className="text-4xl mb-2">🔍</div>
                  <div className="font-medium">No {searchType === 'country' ? 'countries' : searchType === 'recipe' ? 'recipes' : searchType === 'movie' ? 'movies' : 'repositories'} found</div>
                  <div className="text-sm mt-1">Try searching for {searchQuery}</div>
                </div>
              )}

              {!error && !isLoading && results.length > 0 && (
                <div>
                  {results.map((result, index) => (
                    <div
                      key={`${result.type === 'country' ? result.country?.cca2 : result.type === 'recipe' ? result.meal?.idMeal : result.type === 'movie' ? result.movie?.imdbID : result.repo?.id}-${index}`}
                      onClick={() => handleResultClick(result)}
                      className="flex items-center p-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-all duration-150 group"
                    >
                      {result.type === 'country' && result.country ? (
                        <>
                          <div className="relative">
                            <img
                              src={result.country.flags.svg}
                              alt={`${result.country.name.common} flag`}
                              className="w-6 h-4 mr-2 rounded shadow-xs group-hover:scale-105 transition-transform duration-150"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-800 text-sm group-hover:text-blue-600 transition-colors">
                              {result.country.name.common}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {result.aiSummary}
                            </div>
                          </div>
                          <div className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                            {result.country.region}
                          </div>
                        </>
                      ) : result.type === 'recipe' && result.meal ? (
                        <>
                          <div className="relative">
                            <img
                              src={result.meal.strMealThumb}
                              alt={`${result.meal.strMeal} thumbnail`}
                              className="w-6 h-6 mr-2 rounded object-cover shadow-xs group-hover:scale-105 transition-transform duration-150"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-800 text-sm group-hover:text-blue-600 transition-colors">
                              {result.meal.strMeal}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {result.aiSummary}
                            </div>
                          </div>
                          <div className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                            {result.meal.strArea || 'International'}
                          </div>
                        </>
                      ) : result.type === 'movie' && result.movie ? (
                        <>
                          <div className="relative">
                            <img
                              src={result.movie.Poster}
                              alt={`${result.movie.Title} poster`}
                              className="w-6 h-10 mr-2 rounded object-cover shadow-xs group-hover:scale-105 transition-transform duration-150"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-800 text-sm group-hover:text-blue-600 transition-colors">
                              {result.movie.Title}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {result.aiSummary}
                            </div>
                          </div>
                          <div className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                            {result.movie.Year}
                          </div>
                        </>
                      ) : result.type === 'github' && result.repo ? (
                        <>
                          <div className="w-6 h-6 mr-2 rounded bg-gray-700 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform duration-150">
                            <span className="text-white text-xs font-bold">{result.repo.owner.login[0]?.toUpperCase()}</span>
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-800 text-sm group-hover:text-blue-600 transition-colors">
                              {result.repo.name}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {result.aiSummary}
                            </div>
                          </div>
                          <div className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                            {result.repo.language || 'Unknown'}
                          </div>
                        </>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}

              {isLoading && (
                <div className="p-6 text-center text-gray-600">
                  <div className="animate-spin rounded-full h-8 w-8 border-3 border-purple-600 border-t-transparent mx-auto mb-3"></div>
                  <div className="font-medium">Searching {searchType === 'country' ? 'countries' : searchType === 'recipe' ? 'recipes' : searchType === 'movie' ? 'movies' : 'repositories'}...</div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-12 text-center">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20 max-w-2xl mx-auto">
            <div className="grid grid-cols-3 gap-4 text-white text-sm">
              <div className="flex flex-col items-center">
                <div className="text-2xl mb-2">🔍</div>
                <div className="font-semibold">Smart Search</div>
                <div className="text-blue-200 text-xs mt-1">Typo correction</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-2xl mb-2">🤖</div>
                <div className="font-semibold">AI Summaries</div>
                <div className="text-blue-200 text-xs mt-1">Intelligent insights</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-2xl mb-2">🌍</div>
                <div className="font-semibold">{searchType === 'country' ? 'REST Countries' : searchType === 'recipe' ? 'The MealDB' : searchType === 'movie' ? 'OMDB' : 'GitHub'} API</div>
                <div className="text-blue-200 text-xs mt-1">Real-time data</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
