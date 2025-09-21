// components/ThirdPartyJoin.jsx
import { useState, useEffect } from 'react';
import { FaWhatsapp, FaTelegram } from 'react-icons/fa';
import WhatsappIcon from '../assets/Group_93.png';
import TelegramIcon from '../assets/Group_92.png';
import WeChat from '../assets/Group_98.png';
import Weibo from '../assets/Group_97.png';

const ThirdPartyJoin = () => {
    const [whatsappLink, setWhatsappLink] = useState('#'); // Default empty link
    const [telegramLink, setTelegramLink] = useState('#');  // Default empty link
    const [weiboLink, setWeiboLink] = useState('#');
    const [isChinese, setIsChinese] = useState(false);

    const languageLinks = {
        en: {
            telegram: 'https://t.me/Donghuatv24',
            whatsapp: 'https://chat.whatsapp.com/BrMxDiGBKioJTPfwoiZPMH',
        },
        id: {
            telegram: 'https://t.me/IndoDonguas',
            whatsapp: 'https://chat.whatsapp.com/FTRtxlUtGNYJzORRo3pvQN',
        },
        mm: {
            telegram: 'https://t.me/donguas',
            whatsapp: null, // No WhatsApp link for Burmese
        },
        cn: {
            telegram: '#', // Add Chinese Telegram link if available
            wechat: '#',   // Add Chinese WeChat link if available
        },
        // Add links for other languages as needed
    };

    useEffect(() => {
        const handleLanguageChange = (event) => {
            const languageCode = event.detail;
            console.log("ThirdPartyJoin received language:", languageCode);
            updateSocialLinks(languageCode);
        };

        window.addEventListener('languageChanged', handleLanguageChange);

        return () => {
            window.removeEventListener('languageChanged', handleLanguageChange);
        };
    }, []);

    const updateSocialLinks = (languageCode) => {
        const links = languageLinks[languageCode];
        if (links) {
            setTelegramLink(links.telegram || '#'); // Use '#' as fallback
            setWhatsappLink(links.whatsapp || '#'); // Use '#' as fallback
            setIsChinese(languageCode === 'cn');
        } else {
            setTelegramLink('#');
            setWhatsappLink('#');
            setIsChinese(false);
        }
    };

    return (
        <div className="py-4">
            <div className="px-4">
                <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-xl p-4 flex justify-center items-center">
                    <div className="flex flex-col md:flex-row w-full justify-around items-center gap-4">
                        <a href={isChinese ? '#' : whatsappLink} className="flex items-center bg-opacity-20 rounded-full py-2 px-6 w-full md:w-auto justify-center hover:bg-opacity-30 transition">
                            <div className="rounded-full flex items-center justify-center mr-3">
                                {isChinese ? <img src={WeChat} alt="WeChat Icon" /> : <img src={WhatsappIcon} alt="Whatsapp Icon" />}
                            </div>
                        </a>

                        <a href={isChinese ? weiboLink : telegramLink} className="flex items-center bg-opacity-20 rounded-full py-2 px-6 w-full md:w-auto justify-center hover:bg-opacity-30 transition">
                            <div className="rounded-full flex items-center justify-center mr-3">
                                {isChinese ? <img src={Weibo} alt="Weibo Icon" /> : <img src={TelegramIcon} alt="Telegram Icon" />}
                            </div>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ThirdPartyJoin;