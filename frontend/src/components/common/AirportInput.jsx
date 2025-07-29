import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const AirportInput = ({ label, value, onValueChange, placeholder = "City or Airport", selectedAirport, onAirportSelect }) => {
    const [inputValue, setInputValue] = useState(value || '');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        setInputValue(value || '');
    }, [value]);

    useEffect(() => {
        if (inputValue.length < 3) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        const handler = setTimeout(async () => {
            try {
                const response = await api.get(`/flights/search-locations?keyword=${inputValue}`);
                setSuggestions(response.data.locations || []);
                setShowSuggestions(true);
            } catch (error) {
                console.error('Error fetching airport suggestions:', error);
                setSuggestions([]);
                setShowSuggestions(false);
            }
        }, 300);

        return () => clearTimeout(handler);
    }, [inputValue]);

    const handleInputChange = (e) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        onValueChange(newValue);
        
        // Clear selected airport if user is typing
        if (selectedAirport && newValue !== selectedAirport.name) {
            onAirportSelect(null);
        }
    };

    const handleSuggestionClick = (airport) => {
        setInputValue(`${airport.name} (${airport.iataCode})`);
        onValueChange(`${airport.name} (${airport.iataCode})`);
        onAirportSelect(airport);
        setSuggestions([]);
        setShowSuggestions(false);
    };

    const handleBlur = () => {
        // Delay hiding suggestions to allow click events
        setTimeout(() => setShowSuggestions(false), 200);
    };

    const handleFocus = () => {
        if (suggestions.length > 0) {
            setShowSuggestions(true);
        }
    };

    return (
        <div className="relative w-full">
            <label className="block text-sm font-medium text-orange-400 mb-1.5">{label}</label>
            <input
                type="text"
                placeholder={placeholder}
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
                autoComplete="off"
                className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white placeholder-gray-500 border-2 border-gray-700 focus:outline-none focus:border-orange-500 transition-colors"
            />
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full mt-1 w-full bg-gray-900 border border-gray-700 rounded-lg shadow-2xl z-20 max-h-60 overflow-y-auto">
                    <ul>
                        {suggestions.map(suggestion => (
                            <li
                                key={suggestion.id}
                                onMouseDown={() => handleSuggestionClick(suggestion)}
                                className="p-3 hover:bg-orange-600/20 cursor-pointer transition-colors"
                            >
                                <p className="font-semibold text-white">{suggestion.name} ({suggestion.iataCode})</p>
                                <p className="text-sm text-gray-400">{suggestion.address.cityName}, {suggestion.address.countryName}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default AirportInput;
