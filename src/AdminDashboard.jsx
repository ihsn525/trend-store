import React, { useState, useEffect } from 'react';
import { db, storage } from './firebase'; 
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc, orderBy, query } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

function AdminDashboard({ onBack }) {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]); // NEW: Reviews state
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("orders");

  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null); 
  const [imageSource, setImageSource] = useState("url"); 
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [newP, setNewP] = useState({ name: '', price: '', category: 'Tech', image: '', desc: '', stock: '' });

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch reviews specifically when the tab changes
  useEffect(() => {
    if (activeTab === "reviews") {
      fetchReviews();
    }
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const oQ = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      const oSnap = await getDocs(oQ);
      setOrders(oSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      const pSnap = await getDocs(collection(db, "products"));
      setProducts(pSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const rQ = query(collection(db, "reviews"), orderBy("createdAt", "desc"));
      const rSnap = await getDocs(rQ);
      setReviews(rSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Error fetching reviews:", err);
    }
  };

  const handleDeleteReview = async (id) => {
    if (!window.confirm("Delete this review? This will not update the product average rating automatically.")) return;
    try {
      await deleteDoc(doc(db, "reviews", id));
      setReviews(reviews.filter(r => r.id !== id));
    } catch (err) {
      alert("Delete failed");
    }
  };

  // --- BUSINESS ANALYTICS LOGIC ---
  const totalRevenue = orders.reduce((sum, order) => sum + (Number(order.totalAmount) || 0), 0);
  const totalInventoryValue = products.reduce((sum, p) => sum + (Number(p.price) * (Number(p.stock) || 0)), 0);
  const pendingOrders = orders.filter(o => o.status === "Processing").length;

  // --- SEARCH FILTER LOGIC ---
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const uploadImage = async () => {
    if (!selectedFile) return null;
    try {
      setIsUploading(true);
      const storageRef = ref(storage, `products/${Date.now()}_${selectedFile.name}`);
      const snapshot = await uploadBytes(storageRef, selectedFile);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const startEdit = (product) => {
    setEditingId(product.id);
    setNewP({
      name: product.name,
      price: product.price,
      category: product.category,
      image: product.image,
      desc: product.desc,
      stock: product.stock 
    });
    setImageSource("url"); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNewP({ name: '', price: '', category: 'Tech', image: '', desc: '', stock: '' });
  };

  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    let finalImageUrl = newP.image;
    if (imageSource === "upload" && selectedFile) {
      const uploadedUrl = await uploadImage();
      if (!uploadedUrl) return; 
      finalImageUrl = uploadedUrl;
    }

    try {
      const productData = {
        ...newP,
        image: finalImageUrl,
        price: Number(newP.price),
        stock: Number(newP.stock)
      };

      if (editingId) {
        await updateDoc(doc(db, "products", editingId), productData);
        alert("Updated!");
      } else {
        await addDoc(collection(db, "products"), { ...productData, createdAt: new Date(), avgRating: 0, reviewCount: 0 });
        alert("Added!");
      }
      handleCancelEdit();
      fetchData(); 
    } catch (err) { alert("Error saving"); }
  };

  const handleDeleteProduct = async (id) => {
    if(!window.confirm("Delete item?")) return;
    await deleteDoc(doc(db, "products", id));
    setProducts(products.filter(p => p.id !== id));
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { status: newStatus });
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) { alert("Update failed"); }
  };

  if (loading) return <div className="loader">Accessing Master Database...</div>;

  return (
    <div className="checkout-container">
      <div className="checkout-card" style={{ maxWidth: '1100px' }}>
        <button className="back-link" onClick={onBack}>← Back to Store</button>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1>Admin Portal</h1>
          <div className="filter-group" style={{ margin: 0 }}>
            <button className={`filter-chip ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>Orders</button>
            <button className={`filter-chip ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>Inventory</button>
            <button className={`filter-chip ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')}>Reviews</button>
          </div>
        </div>

        {/* ANALYTICS */}
        <div className="analytics-grid">
          <div className="stat-card">
            <p>TOTAL REVENUE</p>
            <h2 style={{ color: '#10b981' }}>${totalRevenue.toFixed(2)}</h2>
          </div>
          <div className="stat-card">
            <p>INVENTORY VALUE</p>
            <h2 style={{ color: 'var(--primary)' }}>${totalInventoryValue.toFixed(2)}</h2>
          </div>
          <div className="stat-card">
            <p>ACTIVE ORDERS</p>
            <h2 style={{ color: '#f59e0b' }}>{pendingOrders}</h2>
          </div>
          <div className="stat-card">
            <p>TOTAL REVIEWS</p>
            <h2 style={{ color: '#7c3aed' }}>{reviews.length}</h2>
          </div>
        </div>

        {/* TAB CONTENT */}
        {activeTab === "orders" && (
           <table className="admin-table">
             <thead>
               <tr><th>Order ID</th><th>Customer</th><th>Total</th><th>Status</th><th>Action</th></tr>
             </thead>
             <tbody>
               {orders.map(order => (
                 <tr key={order.id}>
                   <td style={{ fontSize: '0.8rem' }}>#{order.id.slice(0,8)}</td>
                   <td>{order.customerName}</td>
                   <td style={{ fontWeight: '700' }}>${order.totalAmount?.toFixed(2)}</td>
                   <td><span className={`status-pill ${order.status.toLowerCase()}`}>{order.status}</span></td>
                   <td>
                     <select className="status-select" value={order.status} onChange={(e) => updateStatus(order.id, e.target.value)}>
                       <option value="Processing">Processing</option>
                       <option value="Shipped">Shipped</option>
                       <option value="Delivered">Delivered</option>
                     </select>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
        )}

        {activeTab === "inventory" && (
          <div className="inventory-section">
            <form onSubmit={handleSubmitProduct} className={`order-summary ${editingId ? 'editing-mode' : ''}`}>
              <h3>{editingId ? "Edit Product" : "Add Product"}</h3>
              <div className="form-grid">
                <input className="premium-input" placeholder="Product Name" value={newP.name} onChange={e => setNewP({...newP, name: e.target.value})} required />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input className="premium-input" style={{ flex: 1 }} placeholder="Price" type="number" value={newP.price} onChange={e => setNewP({...newP, price: e.target.value})} required />
                  <input className="premium-input" style={{ flex: 1 }} placeholder="Stock" type="number" value={newP.stock} onChange={e => setNewP({...newP, stock: e.target.value})} required />
                  <select className="premium-input" style={{ flex: 1 }} value={newP.category} onChange={e => setNewP({...newP, category: e.target.value})}>
                    <option value="Tech">Tech</option><option value="Shoes">Shoes</option><option value="Apparel">Apparel</option><option value="Accessories">Accessories</option>
                  </select>
                </div>
                <textarea className="premium-input" style={{ height: '80px' }} placeholder="Description" value={newP.desc} onChange={e => setNewP({...newP, desc: e.target.value})} required />
                <button type="submit" className="checkout-btn-main" disabled={isUploading}>
                  {isUploading ? "Uploading..." : (editingId ? "Update Product" : "List Product")}
                </button>
              </div>
            </form>
            <div className="order-list">
              {filteredProducts.map(p => (
                <div key={p.id} className="order-item-card" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
                    <img src={p.image} style={{width:'50px', height:'50px', borderRadius:'8px'}} alt="" />
                    <div>
                        <p style={{fontWeight:700}}>{p.name}</p>
                        <p style={{fontSize:'0.8rem', color: Number(p.stock) < 5 ? 'red' : 'gray'}}>Stock: {p.stock}</p>
                    </div>
                  </div>
                  <button onClick={() => startEdit(p)} className="edit-link">Edit</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="admin-table-wrapper">
             <table className="admin-table">
               <thead>
                 <tr><th>User</th><th>Product</th><th>Rating</th><th>Comment</th><th>Actions</th></tr>
               </thead>
               <tbody>
                 {reviews.map(rev => (
                   <tr key={rev.id}>
                     <td><strong>{rev.userName}</strong></td>
                     <td style={{ fontSize: '0.8rem', color: '#666' }}>{rev.productId.slice(0,8)}...</td>
                     <td><span className="stars">{"★".repeat(rev.rating)}</span></td>
                     <td className="comment-cell">{rev.comment}</td>
                     <td><button className="delete-btn-sm" onClick={() => handleDeleteReview(rev.id)}>Delete</button></td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;