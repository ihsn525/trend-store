import React, { useState, useEffect } from 'react';
import { db, storage } from './firebase'; 
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc, orderBy, query } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

function AdminDashboard({ onBack }) {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("orders");

  // --- NEW SEARCH STATE ---
  const [searchTerm, setSearchTerm] = useState("");

  // State for Editing
  const [editingId, setEditingId] = useState(null); 

  // State for Image Source Choice
  const [imageSource, setImageSource] = useState("url"); 
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const [newP, setNewP] = useState({ name: '', price: '', category: 'Tech', image: '', desc: '' });

  useEffect(() => {
    fetchData();
  }, []);

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

  // --- FILTER LOGIC ---
  // This derived state handles searching by name OR category automatically
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
      console.error("Upload error:", error);
      alert("Image upload failed!");
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
      desc: product.desc
    });
    setImageSource("url"); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNewP({ name: '', price: '', category: 'Tech', image: '', desc: '' });
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
      if (editingId) {
        const productRef = doc(db, "products", editingId);
        await updateDoc(productRef, {
          ...newP,
          image: finalImageUrl,
          price: Number(newP.price)
        });
        alert("Product updated successfully!");
      } else {
        await addDoc(collection(db, "products"), {
          ...newP,
          image: finalImageUrl,
          price: Number(newP.price),
          createdAt: new Date()
        });
        alert("Product added successfully!");
      }
      
      handleCancelEdit();
      fetchData(); 
    } catch (err) { 
      console.error(err);
      alert("Error saving product"); 
    }
  };

  const handleDeleteProduct = async (id) => {
    if(!window.confirm("Delete this item?")) return;
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
      <div className="checkout-card" style={{ maxWidth: '1000px' }}>
        <button className="back-link" onClick={onBack}>← Back to Store</button>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1>Admin Portal</h1>
          <div className="filter-group" style={{ margin: 0 }}>
            <button className={`filter-chip ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>Orders</button>
            <button className={`filter-chip ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>Inventory</button>
          </div>
        </div>

        {activeTab === "orders" ? (
           <table style={{ width: '100%', borderCollapse: 'collapse' }}>
             <thead>
               <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left', color: 'var(--gray)' }}>
                 <th style={{ padding: '10px' }}>Order ID</th>
                 <th>Customer</th>
                 <th>Total</th>
                 <th>Status</th>
                 <th>Action</th>
               </tr>
             </thead>
             <tbody>
               {orders.map(order => (
                 <tr key={order.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                   <td style={{ padding: '15px 10px', fontSize: '0.8rem' }}>#{order.id.slice(0,8)}</td>
                   <td>{order.customerName}</td>
                   <td style={{ fontWeight: '700' }}>${order.totalAmount?.toFixed(2)}</td>
                   <td><span className="order-status">{order.status}</span></td>
                   <td>
                     <select value={order.status} onChange={(e) => updateStatus(order.id, e.target.value)}>
                       <option value="Processing">Processing</option>
                       <option value="Shipped">Shipped</option>
                       <option value="Delivered">Delivered</option>
                     </select>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
        ) : (
          <div className="inventory-section">
            {/* PRODUCT FORM */}
            <form 
              onSubmit={handleSubmitProduct} 
              className={`order-summary ${editingId ? 'editing-mode' : ''}`} 
              style={{ marginBottom: '40px', textAlign: 'left' }}
            >
              <h3>
                {editingId ? "Editing Product" : "Add New Product"}
                {editingId && <span className="edit-badge">Mode: Active</span>}
              </h3>
              <div className="form-grid">
                <input className="premium-input" placeholder="Product Name" value={newP.name} onChange={e => setNewP({...newP, name: e.target.value})} required />
                <div className="form-row">
                  <input className="premium-input" placeholder="Price" type="number" value={newP.price} onChange={e => setNewP({...newP, price: e.target.value})} required />
                  <select className="premium-input" value={newP.category} onChange={e => setNewP({...newP, category: e.target.value})}>
                    <option value="Tech">Tech</option>
                    <option value="Shoes">Shoes</option>
                    <option value="Apparel">Apparel</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>

                <div style={{ marginBottom: '10px', fontSize: '0.8rem', color: 'var(--gray)' }}>
                  Image Source: 
                  <label style={{ marginLeft: '15px' }}>
                    <input type="radio" checked={imageSource === 'url'} onChange={() => setImageSource('url')} /> URL
                  </label>
                  <label style={{ marginLeft: '15px' }}>
                    <input type="radio" checked={imageSource === 'upload'} onChange={() => setImageSource('upload')} /> Upload File
                  </label>
                </div>

                {imageSource === 'url' ? (
                  <input className="premium-input" placeholder="Image URL" value={newP.image} onChange={e => setNewP({...newP, image: e.target.value})} required={!editingId} />
                ) : (
                  <input className="premium-input" type="file" accept="image/*" onChange={e => setSelectedFile(e.target.files[0])} required={!editingId} />
                )}

                <textarea className="premium-input" style={{ height: '80px' }} placeholder="Description" value={newP.desc} onChange={e => setNewP({...newP, desc: e.target.value})} required />
                
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="submit" className="checkout-btn-main" disabled={isUploading} style={{ flex: 2 }}>
                    {isUploading ? "Uploading..." : (editingId ? "Update Product" : "List Product")}
                    </button>
                    {editingId && (
                        <button type="button" className="checkout-btn-main" onClick={handleCancelEdit} style={{ flex: 1, background: '#666' }}>
                            Cancel
                        </button>
                    )}
                </div>
              </div>
            </form>

            <hr style={{ border: '1px solid #eee', marginBottom: '30px' }} />

            {/* SEARCH BAR */}
            <div style={{ marginBottom: '20px' }}>
                <input 
                    type="text" 
                    className="premium-input" 
                    placeholder="Search by name or category..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ maxWidth: '100%', border: '1px solid var(--primary)' }}
                />
            </div>

            {/* INVENTORY LIST */}
            <div className="order-list">
              {filteredProducts.length > 0 ? (
                filteredProducts.map(p => (
                    <div key={p.id} className="order-item-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <img src={p.image} alt="" style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover' }} />
                        <div>
                          <p style={{ fontWeight: 700 }}>{p.name}</p>
                          <p style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>{p.category} — ${p.price}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => startEdit(p)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}>Edit</button>
                        <button onClick={() => handleDeleteProduct(p.id)} style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 700, cursor: 'pointer' }}>Remove</button>
                      </div>
                    </div>
                  ))
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gray)' }}>
                    No products found matching "{searchTerm}"
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;