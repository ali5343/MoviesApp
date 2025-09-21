// components/PopularCelebrities.js
import { FaChevronRight, FaChevronLeft } from 'react-icons/fa';

const PopularCelebrities = () => {
  const celebrities = [
    { id: 1, name: "Bai Lu", image: "https://pic3.LOGOpic.com/common/lego/20201026/37b926ea899b478b8bf9e23259c92c2a.png" },
    { id: 2, name: "Zhang Ling He", image: "https://pic3.LOGOpic.com/common/lego/20201026/40feaa83a74e45ada3240b716f628d77.png" },
    { id: 3, name: "Chen Zhi Yuan", image: "https://www.LOGOpic.com/lequ/20220217/5b55668540d249218eb50e7fe63b966d.png" },
    { id: 4, name: "Choi Yu", image: "https://pic3.LOGOpic.com/common/lego/20201026/b8b90c553311481eaa605c805448fe5d.png" },
    { id: 5, name: "Esther Yu", image: "https://pic2.LOGOpic.com/common/lego/20201026/c69b49367ca6481586d7001b64841abb.png" },
    { id: 6, name: "Chen Du Ling", image: "https://pic3.LOGOpic.com/common/lego/20201026/37b926ea899b478b8bf9e23259c92c2a.png" },
    { id: 7, name: "Johnny Huang", image: "https://pic3.LOGOpic.com/common/lego/20201026/40feaa83a74e45ada3240b716f628d77.png" },
    { id: 8, name: "Xin Kai", image: "https://www.LOGOpic.com/lequ/20220217/5b55668540d249218eb50e7fe63b966d.png" },
  ];

  return (
    <div className="py-5 relative group">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Popular Celebrities</h2>
        <div className="flex items-center text-sm text-gray-400 hover:text-green-500 cursor-pointer">
          <span>View All</span>
          <FaChevronRight className="ml-1 text-xs" />
        </div>
      </div>
      
      <div className="relative">
        <button className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 bg-black/70 w-8 h-8 rounded-full flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <FaChevronLeft className="text-white" />
        </button>
        
        <div className="flex overflow-x-auto space-x-4 pb-4 scrollbar-hide">
          {celebrities.map(celeb => (
            <div key={celeb.id} className="flex-shrink-0 w-24 cursor-pointer">
              <div className="rounded-full overflow-hidden border-2 border-transparent hover:border-green-500 transition-all">
                <img 
                  src={celeb.image} 
                  alt={celeb.name}
                  className="w-24 h-24 object-cover"
                />
              </div>
              <p className="text-center text-sm mt-2 truncate">{celeb.name}</p>
            </div>
          ))}
        </div>
        
        <button className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 bg-black/70 w-8 h-8 rounded-full flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <FaChevronRight className="text-white" />
        </button>
      </div>
    </div>
  );
};

export default PopularCelebrities;