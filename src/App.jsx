import { useState, useEffect } from 'react';
import './App.css';
import Checkout from './Checkout'; 
import Auth from './Auth'; 
import Profile from './Profile'; 
import AdminDashboard from './AdminDashboard'; 
import { auth, db } from './firebase'; 
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore'; 

function App() {
  const [user, setUser] = useState(null); 
  const [view, setView] = useState("shop");
  const [products, setProducts] = useState([]); 
  const [sortBy, setSortBy] = useState("newest");
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

  const ADMIN_EMAIL = "ihsansiju466@gmail.com";

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
  }, [view]); // Refetch when view changes (e.g., coming back from Admin or Checkout)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && view === "auth") setView("shop");
    });
    return () => unsubscribe();
  }, [view]);

  useEffect(() => {
    localStorage.setItem("trendstore_cart", JSON.stringify(cart));
  }, [cart]);

  const filteredAndSorted = products
    .filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) && 
      (activeTab === "All" || p.category === activeTab)
    )
    .sort((a, b) => {
      if (sortBy === "low") return a.price - b.price;
      if (sortBy === "high") return b.price - a.price;
      if (sortBy === "newest") return b.createdAt?.seconds - a.createdAt?.seconds;
      return 0;
    });

  // UPDATED: Logic to prevent adding more than available stock
  const handleAddToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    const currentQtyInCart = existing ? existing.qty : 0;
    const availableStock = Number(product.stock) || 0;

    if (currentQtyInCart < availableStock) {
      if (existing) {
        setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
      } else {
        setCart([...cart, { ...product, qty: 1 }]);
      }
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } else {
      alert(availableStock === 0 ? "Out of Stock" : `Sorry, only ${availableStock} items available.`);
    }
  };

  // UPDATED: Logic to prevent incrementing beyond stock in sidebar
  const updateQty = (id, delta) => {
    const product = products.find(p => p.id === id);
    const itemInCart = cart.find(item => item.id === id);
    
    if (delta > 0 && itemInCart.qty >= (Number(product.stock) || 0)) {
        alert("Cannot exceed available stock.");
        return;
    }
    
    setCart(cart.map(item => 
      item.id === id ? { ...item, qty: Math.max(1, (Number(item.qty) || 1) + delta) } : item
    ));
  };

  const removeFromCart = (id) => setCart(cart.filter(item => item.id !== id));
  const cartTotal = cart.reduce((sum, item) => sum + (Number(item.price) * Number(item.qty || 0)), 0);
  const totalItems = cart.reduce((sum, item) => sum + Number(item.qty || 0), 0);

  const handleOrderSuccess = (orderDetails) => {
    localStorage.removeItem("trendstore_cart");
    setCart([]); 
    alert(`Success! Order #${orderDetails.id} has been placed.`);
    setView("shop"); 
  };

  const handleLogout = () => signOut(auth).then(() => setView("shop"));

  if (view === "auth") return <Auth onAuthSuccess={() => setView("shop")} onBack={() => setView("shop")} />;
  if (view === "profile") return <Profile onBack={() => setView("shop")} />;
  if (view === "admin") {
    if (user?.email !== ADMIN_EMAIL) { setView("shop"); return null; }
    return <AdminDashboard onBack={() => setView("shop")} />;
  }
  if (view === "checkout") {
    if (!user) { setTimeout(() => setView("auth"), 0); return null; }
    return <Checkout cart={cart} total={cartTotal} onBack={() => setView("shop")} onOrderSuccess={handleOrderSuccess} />;
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
                <button 
                  className="add-btn-premium" 
                  disabled={Number(selectedProduct.stock) <= 0}
                  onClick={() => { handleAddToCart(selectedProduct); setSelectedProduct(null); }}
                >
                  {Number(selectedProduct.stock) <= 0 ? "Out of Stock" : "Add to Bag"}
                </button>
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
              <div className="total-row"><span>Total</span><span>${cartTotal.toFixed(2)}</span></div>
              <button className="checkout-btn" disabled={cart.length === 0} onClick={() => { setIsCartOpen(false); setView("checkout"); }}>
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
                {user.email === ADMIN_EMAIL && (
                  <button className="admin-btn-pill" onClick={() => setView('admin')}>Admin Portal</button>
                )}
                <span className="user-greet" onClick={() => setView("profile")}>My Account</span>
                <button className="logout-btn" onClick={handleLogout}>Logout</button>
              </div>
            ) : (
              <button className="login-link" onClick={() => setView("auth")}>Login</button>
            )}
            <button className="cart-btn" onClick={() => setIsCartOpen(true)}>Bag ({totalItems})</button>
          </div>
        </div>
      </nav>

      <header className="hero">
        <h1>Modern Collection</h1>
        <p>Premium essentials designed for your everyday lifestyle.</p>
      </header>

      <section className="controls-section" style={{ maxWidth: '1000px', margin: '0 auto 40px', background: '#fff', padding: '24px', borderRadius: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
            <input className="search-bar" style={{ width: '100%', paddingLeft: '45px', margin: 0, border: '1px solid #eee' }} placeholder="Search by product name..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div style={{ position: 'relative' }}>
            <select className="sort-dropdown" value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ padding: '14px 40px 14px 20px', borderRadius: '14px', border: '1px solid #eee', background: '#fff', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', appearance: 'none' }}>
              <option value="newest">Newest First</option>
              <option value="low">Price: Low to High</option>
              <option value="high">Price: High to Low</option>
            </select>
            <span style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', opacity: 0.5 }}>⇅</span>
          </div>
        </div>

        <div className="filter-group" style={{ justifyContent: 'center', borderTop: '1px solid #f5f5f5', paddingTop: '20px' }}>
          {["All", "Tech", "Shoes", "Apparel", "Accessories"].map(cat => (
            <button key={cat} className={`filter-chip ${activeTab === cat ? 'active' : ''}`} onClick={() => setActiveTab(cat)}>{cat}</button>
          ))}
        </div>
      </section>

      <main className="product-grid">
        {loading ? (
          <div className="loader">Refreshing Collection...</div>
        ) : filteredAndSorted.length > 0 ? (
          filteredAndSorted.map(p => {
            // UPDATED: MODERN STOCK BADGE LOGIC
            const stockVal = Number(p.stock) || 0;
            let statusClass = "status-high";
            let statusLabel = "In Stock";

            if (stockVal === 0) {
              statusClass = "status-out";
              statusLabel = "Sold Out";
            } else if (stockVal < 5) {
              statusClass = "status-low";
              statusLabel = `Only ${stockVal} left`;
            }

            return (
              <div key={p.id} className={`product-card ${stockVal === 0 ? 'out-of-stock' : ''}`} onClick={() => setSelectedProduct(p)}>
                <div className="image-wrapper">
                  <img src={p.image} alt={p.name} className="product-image" />
                  <div className={`stock-badge ${statusClass}`}>
                    {statusLabel}
                  </div>
                </div>
                <div className="card-details">
                  <p className="card-category">{p.category}</p>
                  <h3 className="card-title">{p.name}</h3>
                  <p className="price-tag">${Number(p.price).toFixed(2)}</p>
                </div>
                <button 
                  className="add-btn" 
                  disabled={stockVal === 0}
                  onClick={(e) => { e.stopPropagation(); handleAddToCart(p); }}
                  style={{ opacity: stockVal === 0 ? 0.6 : 1 }}
                >
                  {stockVal === 0 ? "Unavailable" : "Add to Bag"}
                </button>
              </div>
            );
          })
        ) : (
          <div className="no-results" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '50px' }}>
            <p style={{ color: '#999', fontSize: '1.2rem' }}>No products found matching your criteria.</p>
            <button onClick={() => {setSearch(""); setActiveTab("All")}} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline', marginTop: '10px' }}>Clear all filters</button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;