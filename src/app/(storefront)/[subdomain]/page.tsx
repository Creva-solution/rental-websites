import Link from 'next/link';

export default function StorefrontPage({ params }: { params: { subdomain: string } }) {
  // Mock data based on PRD Persona "Sneha - The Soap Maker"
  const store = {
    name: "Sneha's Handmade Soaps",
    tagline: "Natural, organic, and crafted with love.",
    subdomain: params.subdomain,
    primaryColor: "#3B82F6",
  };

  const products = [
    { id: 1, name: "Lavender Dream Bar", price: "₹299", image: "https://images.unsplash.com/photo-1600857062241-98e5dba7f214?w=800&q=80" },
    { id: 2, name: "Oatmeal & Honey Soap", price: "₹349", image: "https://images.unsplash.com/photo-1584305574647-0cc949a2bb9f?w=800&q=80" },
    { id: 3, name: "Charcoal Detox Soap", price: "₹249", image: "https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=800&q=80" },
    { id: 4, name: "Rose Petal Romance", price: "₹399", image: "https://images.unsplash.com/photo-1610217997577-df9081e813bd?w=800&q=80" },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Store Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
              S
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">{store.name}</h1>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#" className="text-sm font-medium text-gray-700 hover:text-blue-600">Home</Link>
            <Link href="#" className="text-sm font-medium text-gray-700 hover:text-blue-600">Shop</Link>
            <Link href="#" className="text-sm font-medium text-gray-700 hover:text-blue-600">About</Link>
            <Link href="#" className="text-sm font-medium text-gray-700 hover:text-blue-600">Contact</Link>
          </nav>
          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-600 hover:text-gray-900 relative">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
              <span className="absolute top-0 right-0 w-4 h-4 bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full">0</span>
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative h-[500px] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-blue-900/20 z-10" />
          <img 
            src="https://images.unsplash.com/photo-1600857062241-98e5dba7f214?w=1600&q=80" 
            alt="Hero background" 
            className="absolute inset-0 w-full h-full object-cover blur-[2px] scale-105"
          />
          <div className="relative z-20 text-center text-white px-4">
            <h2 className="text-5xl md:text-7xl font-bold tracking-tight mb-4 drop-shadow-lg">{store.name}</h2>
            <p className="text-xl md:text-2xl font-medium mb-8 max-w-2xl mx-auto drop-shadow-md">{store.tagline}</p>
            <button className="bg-white text-gray-900 px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:scale-105 transition-transform">
              Shop Now
            </button>
          </div>
        </section>

        {/* Featured Products */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Our Best Sellers</h3>
            <div className="w-24 h-1 bg-blue-600 mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <div key={product.id} className="group cursor-pointer">
                <div className="relative aspect-square rounded-2xl overflow-hidden mb-4 bg-gray-100 shadow-sm group-hover:shadow-md transition-shadow">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <button className="w-full bg-white text-gray-900 font-bold py-3 rounded-xl hover:bg-blue-50 transition-colors">
                      Add to Cart
                    </button>
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{product.name}</h4>
                  <p className="text-gray-500 font-bold mt-1">{product.price}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">Powered by StoreBuilder</p>
        </div>
      </footer>
    </div>
  );
}
