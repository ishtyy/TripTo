// tempo/frontend/src/components/AirportAutocomplete.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import { PlaneTakeoff, Loader2, X as ClearIcon } from 'lucide-react';

export default function AirportAutocomplete({ label, onLocationSelect, selectedLocation, onMouseEnter, isActive, onClear }) {
  // inputValue is the text the user sees and types in the input box.
  const [inputValue, setInputValue] = useState(''); 
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef(null);
  
  // This effect syncs the input's text ONLY when a new location is selected from the parent
  useEffect(() => {
    if (selectedLocation) {
      setInputValue(`${selectedLocation.address.cityName} (${selectedLocation.iataCode})`);
    } else {
      setInputValue('');
    }
  }, [selectedLocation]);

  // This effect fetches suggestions based on what the user is currently typing
  // THIS IS THE CRITICAL FIX. The logic is now much simpler.
  useEffect(() => {
    // If the input text is empty or already represents a selected location, do nothing.
    if (!inputValue || (selectedLocation && inputValue === `${selectedLocation.address.cityName} (${selectedLocation.iataCode})`)) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const handler = setTimeout(() => {
      setIsLoading(true);
      api.get(`/flights/search-locations?keyword=${inputValue}`)
        .then(response => {
          setSuggestions(response.data.locations || []);
          setShowSuggestions(true); // Explicitly show suggestions when we get a response
        })
        .catch(error => {
          console.error(`Error fetching locations for "${inputValue}":`, error);
          setSuggestions([]);
        })
        .finally(() => setIsLoading(false));
    }, 400); // Debounce to avoid API calls on every keystroke

    return () => clearTimeout(handler);
  }, [inputValue, selectedLocation]);
  
  const handleClickOutside = useCallback((event) => {
    if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  // When a user clicks a suggestion from the list
  const handleSelect = (location) => {
    setShowSuggestions(false);
    onLocationSelect(location); // This sends the full location object up to the parent
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    if (e.target.value === '') {
        onClear(); // Tell the parent to clear its state
    }
  };

  return (
    <div 
      className="relative w-full" 
      ref={wrapperRef} 
      onMouseEnter={onMouseEnter} // This tells the parent page which input is active
    >
      <label className="block text-sm font-medium text-gray-200 mb-1">{label}</label>
      <div className="relative">
        <PlaneTakeoff className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
          placeholder="City or airport name..."
          autoComplete="off"
          className={`w-full pl-10 pr-10 py-2 rounded-lg bg-gray-800 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ocean border-2 transition-colors ${isActive ? 'border-sky-500' : 'border-gray-700'}`}
        />
        {isLoading && <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 animate-spin" size={20} />}
        {!isLoading && inputValue && (
          <button
            onClick={onClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white"
            title="Clear"
          >
            <ClearIcon size={18} />
          </button>
        )}
      </div>
      
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-20 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto custom-scrollbar">
          {suggestions.map((loc) => (
            <li
              key={loc.id}
              onClick={() => handleSelect(loc)}
              className="px-4 py-2 hover:bg-ocean/80 cursor-pointer text-gray-200"
            >
              <p className="font-semibold">{loc.name} ({loc.iataCode})</p>
              <p className="text-sm text-gray-400">{loc.address.cityName}, {loc.address.countryName}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
