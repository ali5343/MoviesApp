// components/Footer.js
import { FaFacebookF, FaTwitter, FaInstagram, FaYoutube } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-gray-900 pt-10 pb-6 border-t border-gray-800">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {/* <div>
            <h3 className="text-gray-400 font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li className="hover:text-green-500 cursor-pointer">About LOGO</li>
              <li className="hover:text-green-500 cursor-pointer">Careers</li>
              <li className="hover:text-green-500 cursor-pointer">Business Cooperation</li>
            </ul>
          </div> */}
          
          {/* <div>
            <h3 className="text-gray-400 font-semibold mb-4">Help and Support</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li className="hover:text-green-500 cursor-pointer">Contact Us</li>
              <li className="hover:text-green-500 cursor-pointer">FAQs</li>
              <li className="hover:text-green-500 cursor-pointer">Device Support</li>
            </ul>
          </div> */}
          
          <div>
            <h3 className="text-gray-400 font-semibold mb-4">Terms of Service</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li className="hover:text-green-500 cursor-pointer">Terms of Use</li>
              <li className="hover:text-green-500 cursor-pointer">Privacy Policy</li>
              <li className="hover:text-green-500 cursor-pointer">Copyright Policy</li>
            </ul>
          </div>
          
          {/* <div>
            <h3 className="text-gray-400 font-semibold mb-4">Follow Us</h3>
            <div className="flex space-x-4">
              <FaFacebookF className="text-gray-500 hover:text-green-500 cursor-pointer" />
              <FaTwitter className="text-gray-500 hover:text-green-500 cursor-pointer" />
              <FaInstagram className="text-gray-500 hover:text-green-500 cursor-pointer" />
              <FaYoutube className="text-gray-500 hover:text-green-500 cursor-pointer" />
            </div>
          </div> */}
        </div>
        
        <div className="text-center text-xs text-gray-600 pt-6 border-t border-gray-800">
          <p>© 2025 Donguas.com International. This content is not from this website, it is integrated from another websites.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;