// components/Footer.tsx
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-b from-[#0a0f1f] to-gray-950 border-t border-cyan-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <div className="flex items-center mb-6">
              <div className="bg-gradient-to-r from-cyan-500 to-blue-600 w-10 h-10 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">0G</span>
              </div>
              <span className="text-xl font-bold ml-3 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                0G NFT Marketplace
              </span>
            </div>
            <p className="text-gray-400 mb-6">
              The next-generation NFT marketplace powered by 0G Labs&apos; high-performance blockchain.
              Experience instant trades, near-zero fees, and limitless scalability.
            </p>
            <div className="flex space-x-4">
              {['twitter', 'discord', 'telegram', 'github'].map((platform) => (
                <a
                  key={platform}
                  href="#"
                  className="bg-gray-900/50 border border-cyan-900/30 w-10 h-10 rounded-full flex items-center justify-center hover:bg-cyan-900/20 transition-colors duration-300"
                >
                  <span className="sr-only">{platform}</span>
                  <div className="text-cyan-400">
                    {/* Social icons remain unchanged */}
                  </div>
                </a>
              ))}
            </div>
          </div>
          
          {/* Essential Marketplace Links */}
          <div>
            <h3 className="text-lg font-semibold text-cyan-400 mb-6">Marketplace</h3>
            <ul className="space-y-3">
              {[
                { name: 'Home', href: '/' },
                { name: 'Collections', href: '/collections' },
              ].map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="text-gray-400 hover:text-cyan-400 transition-colors duration-300">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* 0G Ecosystem Links */}
          <div>
            <h3 className="text-lg font-semibold text-cyan-400 mb-6">0G Ecosystem</h3>
            <ul className="space-y-3">
              {[
                { name: '0G Home', href: 'https://0g.ai' },
                { name: 'Documentation', href: 'https://docs.0g.ai' },
              ].map((item) => (
                <li key={item.name}>
                  <a 
                    href={item.href} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-cyan-400 transition-colors duration-300"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Divider */}
        <div className="border-t border-cyan-900/30 my-12"></div>
        
        {/* Bottom Row */}
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-500 text-sm mb-4 md:mb-0">
            © {new Date().getFullYear()} 0G NFT Marketplace. All rights reserved.
          </div>
          
          <div className="flex space-x-6">
            {['Privacy Policy', 'Terms of Service'].map((item) => (
              <a 
                key={item} 
                href="#" 
                className="text-gray-500 hover:text-cyan-400 text-sm transition-colors duration-300"
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;