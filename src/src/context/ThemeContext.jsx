import React, { createContext, useState, useEffect, useContext } from 'react';

// Create the Theme Context
export const ThemeContext = createContext();

// Create the Theme Provider component
export const ThemeProvider = ({ children }) => {
    // State to hold the current theme: 'light' or 'dark'
    // Initialize from localStorage or default to 'light'
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme || 'light';
    });

    // Effect to apply the 'dark' class to the body element
    // and save the theme preference to localStorage whenever the theme changes
    useEffect(() => {
        const root = document.documentElement; // Or document.body if you prefer
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    // Function to toggle the theme
    const toggleTheme = () => {
        setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

// Custom hook to easily consume the theme context
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};