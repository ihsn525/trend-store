import { useState, useEffect } from 'react';
import './App.css';
import Checkout from './Checkout'; 
import Auth from './Auth'; 
import Profile from './Profile'; // Import your new Profile component
import AdminDashboard from './AdminDashboard'; // Part 2: Import the component
import { auth, db } from './firebase'; // Import db for firestore
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore'; // Import firestore methods

function App() {
  const [user, setUser] = useState(null); 
  const [view, setView] = useState("shop");
  const [products, setProducts] = useState([]); // State for dynamic products
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem("trendstore_cart");
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.map(item => ({ 
        ...item, 
        price: Number(item.price) || 0,
        qty: Number(item.qty) || 1 
      })) : [];
    } catch (e) {
      return [];
    }
  });

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(true);

  // Define your admin email here
  const ADMIN_EMAIL = "ihsansiju466@gmail.com";

  // 1. Fetch Products from Firestore
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const items = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProducts(items);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // 2. Monitor Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && view === "auth") {
        setView("shop");
      }
    });
    return () => unsubscribe();
  }, [view]);

  // 3. Persist Cart
  useEffect(() => {
    localStorage.setItem("trendstore_cart", JSON.stringify(cart));
  }, [cart]);

  const handleAddToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, qty: (Number(item.qty) || 1) + 1 } : item));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const updateQty = (id, delta) => {
    setCart(cart.map(item => 
      item.id === id ? { ...item, qty: Math.max(1, (Number(item.qty) || 1) + delta) } : item
    ));
  };

  const removeFromCart = (id) => setCart(cart.filter(item => item.id !== id));

  const cartTotal = cart.reduce((sum, item) => sum + (Number(item.price) * Number(item.qty || 0)), 0);
  const totalItems = cart.reduce((sum, item) => sum + Number(item.qty || 0), 0);

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) && 
    (activeTab === "All" || p.category === activeTab)
  );

const handleOrderSuccess = (orderDetails) => {
  // 1. Clear Local Storage
  localStorage.removeItem("trendstore_cart");
  
  // 2. Reset Cart State
  setCart([]); 
  
  // 3. Show Success Message
  alert(`Success! Order #${orderDetails.id} has been placed.`);
  
  // 4. Redirect to Shop
  setView("shop"); 
};

  const handleLogout = () => {
    signOut(auth).then(() => {
        setView("shop");
    });
  };

  // --- CONDITIONAL VIEW LOGIC ---
  if (view === "auth") {
    return <Auth onAuthSuccess={() => setView("shop")} onBack={() => setView("shop")} />;
  }

  if (view === "profile") {
    return <Profile onBack={() => setView("shop")} />;
  }

  // Part 2: Handle view === 'admin'
  if (view === "admin") {
  if (user?.email !== "ihsansiju466@gmail.com") {
    setView("shop"); // Redirect non-admins
    return null;
  }
  return <AdminDashboard onBack={() => setView("shop")} />;
}

  if (view === "checkout") {
    if (!user) {
      setTimeout(() => setView("auth"), 0);
      return null;
    }
    return (
      <Checkout 
        cart={cart} 
        total={cartTotal} 
        onBack={() => setView("shop")} 
        onOrderSuccess={handleOrderSuccess} 
      />
    );
  }

  return (
    <div className="app-container">
      {showToast && <div className="toast">Added to bag! 🛍️</div>}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-modal-premium" onClick={() => setSelectedProduct(null)}>✕</button>
            <img src={selectedProduct.image} className="modal-image" alt={selectedProduct.name} />
            <div className="modal-details">
              <p className="card-category">{selectedProduct.category}</p>
              <h2>{selectedProduct.name}</h2>
              <p className="modal-desc">{selectedProduct.desc}</p>
              <div className="modal-footer">
                <span className="modal-price">${Number(selectedProduct.price).toFixed(2)}</span>
                <button className="add-btn-premium" onClick={() => { handleAddToCart(selectedProduct); setSelectedProduct(null); }}>Add to Bag</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cart Sidebar */}
      {isCartOpen && (
        <div className="cart-overlay" onClick={() => setIsCartOpen(false)}>
          <div className="cart-sidebar" onClick={e => e.stopPropagation()}>
            <div className="cart-header">
              <h2>Your Bag ({totalItems})</h2>
              <button className="close-btn" onClick={() => setIsCartOpen(false)}>✕</button>
            </div>
            
            <div className="cart-items-list">
              {cart.length === 0 ? (
                <div className="empty-state">Your bag is empty.</div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="cart-item">
                    <img src={item.image} className="cart-item-img" alt={item.name} />
                    <div className="cart-item-info">
                      <p className="item-name">{item.name}</p>
                      <div className="qty-controls">
                        <button onClick={() => updateQty(item.id, -1)}>-</button>
                        <span>{item.qty}</span>
                        <button onClick={() => updateQty(item.id, 1)}>+</button>
                      </div>
                    </div>
                    <div className="cart-item-right">
                      <p className="item-price">${(item.price * item.qty).toFixed(2)}</p>
                      <button className="remove-link" onClick={() => removeFromCart(item.id)}>Remove</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="cart-footer">
              <div className="total-row">
                <span>Total</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <button 
                className="checkout-btn" 
                disabled={cart.length === 0} 
                onClick={() => {
                  setIsCartOpen(false);
                  setView("checkout");
                }}
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="navbar">
        <div className="nav-content">
          <div className="logo" style={{cursor: 'pointer'}} onClick={() => setView('shop')}>TrendStore</div>
          <div className="nav-actions">
            {user ? (
              <div className="user-nav-group">
                {/* Part 2: The Trigger Button (Visible only to Admin) */}
                {user.email === ADMIN_EMAIL && (
                  <button className="admin-btn-pill" onClick={() => setView('admin')}>Admin Portal</button>
                )}
                
                <span className="user-greet" onClick={() => setView("profile")}>
                  My Account
                </span>
                <button className="logout-btn" onClick={handleLogout}>Logout</button>
              </div>
            ) : (
              <button className="login-link" onClick={() => setView("auth")}>Login</button>
            )}
            <button className="cart-btn" onClick={() => setIsCartOpen(true)}>
              Bag ({totalItems})
            </button>
          </div>
        </div>
      </nav>

      <header className="hero">
        <h1>Modern Collection</h1>
        <p>Premium essentials designed for your everyday lifestyle.</p>
      </header>

      <section className="controls-section">
        <input 
          className="search-bar" 
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="filter-group">
          {["All", "Tech", "Shoes", "Apparel", "Accessories"].map(cat => (
            <button 
              key={cat}
              className={`filter-chip ${activeTab === cat ? 'active' : ''}`}
              onClick={() => setActiveTab(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      <main className="product-grid">
        {loading ? (
          <div className="loader">Refreshing Collection...</div>
        ) : filtered.length > 0 ? (
          filtered.map(p => (
            <div key={p.id} className="product-card" onClick={() => setSelectedProduct(p)}>
              <div className="image-wrapper">
                <img src={p.image} alt={p.name} className="product-image" />
              </div>
              <div className="card-details">
                <p className="card-category">{p.category}</p>
                <h3 className="card-title">{p.name}</h3>
                <p className="price-tag">${Number(p.price).toFixed(2)}</p>
              </div>
              <button className="add-btn" onClick={(e) => { e.stopPropagation(); handleAddToCart(p); }}>Add to Bag</button>
            </div>
          ))
        ) : (
          <div className="no-results">No products found.</div>
        )}
      </main>
    </div>
  );
}

export default App;