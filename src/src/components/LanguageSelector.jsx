import { useState, useEffect } from 'react';
import { FaChevronRight, FaChevronLeft } from 'react-icons/fa';

const LanguageSelector = () => {
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    const [scrollPosition, setScrollPosition] = useState(0);
    const [selectedLanguage, setSelectedLanguage] = useState('en');

    // Original list of languages
    const initialLanguages = [
        { id: 1, name: "English", code: "en" },
        { id: 2, name: "Indo", code: "id" },
        { id: 3, name: "中文", code: "cn" },
        { id: 4, name: "Burma", code: "mm" },
        { id: 5, name: "Hindi", code: "hi" },
        { id: 6, name: "Khmer", code: "kh" },
        { id: 7, name: "Bengali", code: "bn" },
        { id: 8, name: "Viet", code: "vn" },
        { id: 9, name: "French", code: "fr" },
        { id: 10, name: "More", code: "more" },
    ];

    // State to hold the currently ordered languages
    const [orderedLanguages, setOrderedLanguages] = useState(initialLanguages);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
            setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Effect to reorder languages when selectedLanguage changes
    useEffect(() => {
        reorderLanguages(selectedLanguage);
    }, [selectedLanguage]);

    const reorderLanguages = (currentCode) => {
        const selectedLangObj = initialLanguages.find(lang => lang.code === currentCode);
        if (selectedLangObj) {
            const filteredLanguages = initialLanguages.filter(lang => lang.code !== currentCode);
            setOrderedLanguages([selectedLangObj, ...filteredLanguages]);
        }
    };

    const scroll = (direction) => {
        const container = document.getElementById('language-scroll-container');
        if (container) {
            const scrollAmount = direction === 'left' ? -100 : 100;
            container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            // Update scroll position to reflect the new state of the scroll container
            setTimeout(() => {
                setScrollPosition(container.scrollLeft);
            }, 300); // Small delay to allow smooth scroll to complete
        }
    };

    const handleLanguageClick = (code) => {
        setSelectedLanguage(code);
        // The useEffect for selectedLanguage will handle the reordering
        console.log("Dispatching language change event with code:", code);
        window.dispatchEvent(new CustomEvent('languageChanged', {
            detail: code,
            bubbles: true,
        }));
    };

    return (
        <div className="bg-black py-2 relative">
            <div className="container mx-auto px-2">
                <div
                    id="language-scroll-container"
                    className={`flex overflow-x-auto scrollbar-hide py-1 ${isMobile || isTablet ? 'justify-start' : 'justify-center'}`}
                    style={{ scrollBehavior: 'smooth' }}
                    onScroll={(e) => setScrollPosition(e.target.scrollLeft)} // Update scroll position on user scroll
                >
                    {orderedLanguages.map(lang => (
                        <div
                            key={lang.id}
                            className="flex-shrink-0 text-center cursor-pointer px-1"
                            onClick={() => handleLanguageClick(lang.code)}
                        >
                            <div className={`w-14 h-14 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-1 border-2 overflow-hidden ${selectedLanguage === lang.code ? 'border-yellow-500' : 'border-gray-600'}`}>
                                <img
                                    src={`/subtitle_images/${lang.code}.svg`}
                                    alt={lang.name}
                                    className="w-10 h-10 sm:w-10 sm:h-10 md:w-12 md:h-12"
                                    onError={(e) => {
                                        console.log(`Failed to load SVG for ${lang.code}:`, e.target.src);
                                        e.target.style.display = 'none';
                                    }}
                                />
                            </div>
                            <p className="text-xs text-white">{lang.code.toUpperCase()}</p>
                        </div>
                    ))}
                </div>

                {(isMobile || isTablet) && (
                    <>
                        <button
                            onClick={() => scroll('left')}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/70 w-6 h-6 rounded-full flex items-center justify-center z-10"
                            disabled={scrollPosition <= 0}
                        >
                            <FaChevronLeft className="text-white text-xs" />
                        </button>

                        <button
                            onClick={() => scroll('right')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/70 w-6 h-6 rounded-full flex items-center justify-center z-10"
                            // You might want to add a disabled state for the right arrow if you reach the end
                        >
                            <FaChevronRight className="text-white text-xs" />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default LanguageSelector;