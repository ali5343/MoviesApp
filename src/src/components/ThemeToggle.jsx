import React from 'react';
import { useTheme } from '../context/ThemeContext'; // Import useTheme hook
import { FaSun, FaMoon } from 'react-icons/fa'; // Icons for light/dark mode

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none transition-colors duration-300"
            aria-label="Toggle theme"
        >
            {theme === 'light' ? (
                <FaMoon className="w-5 h-5" />
            ) : (
                <FaSun className="w-5 h-5" />
            )}
        </button>
    );
};

export default ThemeToggle;