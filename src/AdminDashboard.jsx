import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc, orderBy, query } from 'firebase/firestore';

function AdminDashboard({ onBack }) {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("orders"); // "orders" or "inventory"

  // New Product Form State
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

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const docRef = await addDoc(collection(db, "products"), {
        ...newP,
        price: Number(newP.price)
      });
      setProducts([...products, { id: docRef.id, ...newP, price: Number(newP.price) }]);
      setNewP({ name: '', price: '', category: 'Tech', image: '', desc: '' });
      alert("Product added successfully!");
    } catch (err) { alert("Error adding product"); }
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
            <form onSubmit={handleAddProduct} className="order-summary" style={{ marginBottom: '40px', textAlign: 'left' }}>
              <h3>Add New Product</h3>
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
                <input className="premium-input" placeholder="Image URL" value={newP.image} onChange={e => setNewP({...newP, image: e.target.value})} required />
                <textarea className="premium-input" style={{ height: '80px' }} placeholder="Description" value={newP.desc} onChange={e => setNewP({...newP, desc: e.target.value})} required />
                <button type="submit" className="checkout-btn-main">List Product</button>
              </div>
            </form>

            <div className="order-list">
              {products.map(p => (
                <div key={p.id} className="order-item-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <img src={p.image} alt="" style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover' }} />
                    <div>
                      <p style={{ fontWeight: 700 }}>{p.name}</p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>{p.category} — ${p.price}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteProduct(p.id)} style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 700, cursor: 'pointer' }}>Remove</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;