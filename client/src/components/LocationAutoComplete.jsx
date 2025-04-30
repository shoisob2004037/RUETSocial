"use client"

import { useState, useEffect, useRef } from "react"

const LocationAutocomplete = ({ value, onChange, placeholder, label, name }) => {
  const [query, setQuery] = useState(value || "")
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef(null)
  const suggestionsRef = useRef(null)

  // Function to fetch location suggestions
  const fetchSuggestions = async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) {
      setSuggestions([])
      return
    }

    setLoading(true)
    try {
      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
          searchQuery,
        )}&format=json&apiKey=43030acee74f40268c81eb72052eccef`,
      )
      const data = await response.json()

      if (data.results) {
        const formattedSuggestions = data.results.map((result) => {
          // Format the display name based on available data
          const city = result.city || result.county || ""
          const state = result.state || ""
          const country = result.country || ""

          let formattedName = ""
          if (city) formattedName += city
          if (state && state !== city) formattedName += formattedName ? `, ${state}` : state
          if (country) formattedName += formattedName ? `, ${country}` : country

          return {
            id: result.place_id || Math.random().toString(),
            name: formattedName || result.formatted,
            fullDetails: result,
          }
        })

        setSuggestions(formattedSuggestions)
      } else {
        setSuggestions([])
      }
    } catch (error) {
      console.error("Error fetching location suggestions:", error)
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value
    setQuery(value)
    onChange({ target: { name, value } }) // Update parent form state
    fetchSuggestions(value)
    setShowSuggestions(true)
  }

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion) => {
    setQuery(suggestion.name)
    onChange({ target: { name, value: suggestion.name } }) // Update parent form state
    setSuggestions([])
    setShowSuggestions(false)
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleInputChange}
        placeholder={placeholder}
        className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
        onFocus={() => query.length >= 2 && setShowSuggestions(true)}
      />

      {loading && (
        <div className="absolute right-3 top-9">
          <svg
            className="animate-spin h-5 w-5 text-blue-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto"
        >
          <ul className="py-1">
            {suggestions.map((suggestion) => (
              <li
                key={suggestion.id}
                className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-gray-700 text-sm"
                onClick={() => handleSelectSuggestion(suggestion)}
              >
                {suggestion.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default LocationAutocomplete
