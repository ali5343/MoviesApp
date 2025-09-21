import { useState, useEffect } from 'react';
import { FaUser, FaSearch, FaBell, FaDownload, FaGlobe, FaEllipsisH } from 'react-icons/fa';

const Navbar = () => {
  const [searchFocused, setSearchFocused] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(localStorage.getItem('selectedLanguageCode') || 'en');

  const logoPaths = {
    en: '/logos/en.png',
    id: '/logos/id.jpg',
    cn: '/logos/cn.png',
    mm: '/logos/mm.png',
    hi: '/logos/hi.png',
    kh: '/logos/kh.jpg',
    bn: '/logos/bn.jpg',
    vn: '/logos/vn.png',
    fr: '/logos/fr.jpg',
    more: '/logos/kr.png',
  };

  useEffect(() => {
    // Handler for the custom event
    const handleLanguageChange = (event) => {
      console.log("Language changed event received:", event.detail);
      setSelectedLanguage(event.detail);
    };

    // Add event listener
    window.addEventListener('languageChanged', handleLanguageChange);

    // Clean up the event listener when component unmounts
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange);
    };
  }, []);

  // For debugging
  useEffect(() => {
    console.log("Selected language in Navbar:", selectedLanguage);
    console.log("Logo path:", logoPaths[selectedLanguage] || logoPaths.en);
  }, [selectedLanguage]);

  return (
    <nav className="bg-gray-900 py-2 px-4 shadow sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <div className="mr-8">
            <img
              src={logoPaths[selectedLanguage] || logoPaths.en}
              alt={`${selectedLanguage.toUpperCase()} Logo`}
              className="h-8"
            />
          </div>
          {/* <ul className="hidden md:flex space-x-6 text-sm">
            <li className="text-green-400 font-medium">For You</li>
            <li className="hover:text-green-400 transition">Drama</li>
            <li className="hover:text-green-400 transition">
              <div className="flex items-center">
                More <FaEllipsisH className="ml-1 text-xs" />
              </div>
            </li>
          </ul> */}
        </div>
        <div className="flex items-center space-x-4">
          <div className={`bg-gray-800 rounded-full overflow-hidden flex items-center px-3 py-1 ${searchFocused ? 'ring-1 ring-green-400' : ''}`}>
            <input
              type="text"
              placeholder="Try Play Next Show"
              className="bg-transparent text-sm w-56 focus:outline-none"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            <FaSearch className="text-gray-400 ml-1" />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;