// components/HeroSection.js
import { useState, useEffect } from 'react';
import { FaPlay, FaPlus } from 'react-icons/fa';
import data from '../data/data.json';

const HeroSection = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [translations, setTranslations] = useState(data);
    const selectedLanguage = localStorage.getItem('selectedLanguageCode') || 'en';

    // Sample slider data (same as before)
    const sliderData = [
        {
            id: 1,
            title: "SKELETON CREW",
            rating: "8.7",
            year: "2025",
            quality: "HD",
            episodes: "16 episodes 6-11",
            description: "The thrilling adventure of a team of space travelers who discover a mysterious ship.",
            image: "https://picsum.photos/1200/600?random=1",
            tags: ["Popular now", "Sci-Fi", "Adventure"]
        },
        {
            id: 2,
            title: "BAD SISTERS",
            rating: "9.2",
            year: "2024",
            quality: "4K",
            episodes: "Season 2",
            description: "Five sisters navigate their complicated relationships while dealing with a family mystery.",
            image: "https://picsum.photos/1200/600?random=2",
            tags: ["Trending", "Drama", "Thriller"]
        },
        {
            id: 3,
            title: "SHRINKING",
            rating: "8.9",
            year: "2025",
            quality: "HD",
            episodes: "12 episodes",
            description: "A therapist begins to break the rules by telling his clients exactly what he thinks.",
            image: "https://picsum.photos/1200/600?random=3",
            tags: ["New", "Comedy", "Drama"]
        },
        {
            id: 4,
            title: "MARTIAL INVERSE",
            rating: "9.5",
            year: "2025",
            quality: "HD",
            episodes: "36 episodes",
            description: "An epic tale of a warrior who discovers his destiny is to save the mystical realm.",
            image: "https://picsum.photos/1200/600?random=4",
            tags: ["Popular", "Action", "Fantasy"]
        }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % sliderData.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [sliderData.length]);

    useEffect(() => {
        fetch('/data.json')
            .then(response => response.json())
            .then(data => {
                setTranslations(data);
            })
            .catch(error => console.error("Error fetching translations:", error));
    }, []);

    const goToSlide = (index) => {
        setCurrentSlide(index);
    };

    const currentSlideData = sliderData[currentSlide];

    return (
        <div className="relative h-[70vh] bg-gray-900 overflow-hidden">
            {/* Main Hero Image */}
            <div className="absolute inset-0 w-full h-full">
                {sliderData.map((slide, index) => (
                    <div
                        key={slide.id}
                        className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
                    >
                        <img
                            src={slide.image}
                            alt={slide.title}
                            className="w-full h-full object-cover"
                            style={{ objectPosition: 'center' }}
                        />
                    </div>
                ))}
            </div>

            {/* Left Blending Overlay */}
            <div
                className="absolute top-0 bottom-0 left-0 w-64 z-20"
                style={{
                    backgroundImage: `url(${currentSlideData.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'left center',
                    filter: 'blur(50px)',
                    opacity: 0.7,
                    background: `linear-gradient(to right, rgba(17, 24, 39, 1) 0%, transparent 50%)`, // Adjust transparency stop
                    backgroundBlendMode: 'overlay',
                }}
                aria-hidden="true"
            ></div>

            {/* Right Blending Overlay */}
            <div
                className="absolute top-0 bottom-0 right-0 w-64 z-20"
                style={{
                    backgroundImage: `url(${currentSlideData.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'right center',
                    filter: 'blur(50px)',
                    opacity: 0.7,
                    background: `linear-gradient(to left, rgba(17, 24, 39, 1) 0%, transparent 50%)`, // Adjust transparency stop
                    backgroundBlendMode: 'overlay',
                }}
                aria-hidden="true"
            ></div>

            {/* Content Area */}
            <div className="relative container mx-auto h-full flex items-end px-4 pb-16 z-40">
                <div className="max-w-xl">
                    {/* Tags, Title, Info, Description, Action Buttons (same as before) */}
                    <div className="flex flex-wrap space-x-2 mb-4">
                        {currentSlideData.tags.map((tag, index) => (
                            <span
                                key={index}
                                className={`text-xs px-2 py-0.5 rounded ${index === 0 ? 'bg-green-500' : 'bg-gray-700'}`}
                            >
                                {tag}
                            </span>
                        ))}
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400">
                        {currentSlideData.title}
                    </h1>

                    <div className="flex items-center space-x-3 text-sm text-gray-300 mb-4">
                        <span className="font-semibold text-white">{currentSlideData.rating}</span>
                        <span>{currentSlideData.year}</span>
                        <span>{currentSlideData.quality}</span>
                        <span>{currentSlideData.episodes}</span>
                    </div>

                    <p className="text-gray-300 mb-6 text-sm">
                        {currentSlideData.description}
                    </p>

                    <div className="flex space-x-4">
                        <button className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-full flex items-center transition">
                            <FaPlay className="mr-2" /> {translations[selectedLanguage]?.heroSection?.play || translations.en.heroSection.play}
                        </button>
                        <button className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-full flex items-center transition">
                            <FaPlus className="mr-2" /> {translations[selectedLanguage]?.heroSection?.add || translations.en.heroSection.add}
                        </button>
                    </div>
                </div>
            </div>

            {/* Navigation Indicators (same as before) */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-40">
                {sliderData.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`h-1 rounded-full transition-all ${index === currentSlide
                            ? 'w-12 bg-green-500'
                            : 'w-2 bg-gray-500 hover:bg-gray-400'
                            }`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default HeroSection;