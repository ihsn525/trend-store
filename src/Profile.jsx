import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs 
} from 'firebase/firestore';

function Profile({ onBack }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('orders'); // State to control menu switching
  const [profile, setProfile] = useState({
    name: '', // Added name for Account Details
    email: '', // Added email for display
    address: '',
    city: '',
    phone: '',
    postalCode: ''
  });

  const user = auth.currentUser;

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered': return { bg: '#dcfce7', text: '#166534' };
      case 'shipped': return { bg: '#dbeafe', text: '#1e40af' };
      case 'processing': return { bg: '#fef3c7', text: '#92400e' };
      default: return { bg: '#f1f5f9', text: '#475569' };
    }
  };

  useEffect(() => {
    const fetchUserDataAndOrders = async () => {
      if (user) {
        try {
          // Fetch Profile
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setProfile({
              name: data.name || user.displayName || '',
              email: user.email || '',
              address: data.address || '',
              city: data.city || '',
              phone: data.phone || '',
              postalCode: data.postalCode || ''
            });
          }

          // Fetch Orders
          const q = query(
            collection(db, "orders"),
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc")
          );
          
          const querySnapshot = await getDocs(q);
          setOrders(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        } catch (err) {
          console.error("Error fetching account data:", err);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchUserDataAndOrders();
  }, [user]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        ...profile,
        updatedAt: new Date()
      });
      alert("Changes saved successfully! ✨");
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Failed to update.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loader">Loading your account...</div>;

  return (
    <div className="checkout-container" style={{maxWidth: '1200px', margin: '0 auto', padding: '40px 20px'}}>
      
      {/* SIDEBAR NAVIGATION */}
      <div style={{display: 'flex', gap: '30px', alignItems: 'flex-start'}}>
        
        <div style={{width: '280px', flexShrink: 0}}>
          <button className="back-link" onClick={onBack} style={{marginBottom: '20px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold'}}>← Back to Store</button>
          
          <div className="checkout-card" style={{padding: '10px', borderRadius: '20px'}}>
            <div style={{padding: '20px'}}>
              <h2 style={{fontSize: '1.2rem', margin: 0}}>My Account</h2>
              <p style={{fontSize: '0.8rem', color: '#64748b'}}>{profile.email}</p>
            </div>
            
            <nav style={{display: 'flex', flexDirection: 'column', gap: '5px'}}>
              {[
                { id: 'orders', label: 'My Orders', icon: '📦' },
                { id: 'addresses', label: 'Saved Addresses', icon: '📍' },
                { id: 'details', label: 'Account Details', icon: '👤' }
              ].map(item => (
                <button 
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 20px',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    fontWeight: activeTab === item.id ? '700' : '500',
                    background: activeTab === item.id ? '#f1f5f9' : 'transparent',
                    color: activeTab === item.id ? 'var(--primary)' : '#64748b',
                    textAlign: 'left',
                    transition: 'all 0.2s'
                  }}
                >
                  <span>{item.icon}</span> {item.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="checkout-card" style={{flex: 1, padding: '40px', borderRadius: '24px', minHeight: '600px'}}>
          
          {/* VIEW: MY ORDERS */}
          {activeTab === 'orders' && (
            <div className="order-history-section">
              <h2 style={{marginBottom: '30px', fontSize: '2rem'}}>Order History</h2>
              {orders.length === 0 ? (
                <div className="empty-state">
                  <p>You haven't placed any orders yet.</p>
                </div>
              ) : (
                <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
                  {orders.map(order => {
                    const statusTheme = getStatusStyle(order.status);
                    return (
                      <div key={order.id} style={{padding: '25px', borderRadius: '20px', border: '1px solid #f1f5f9', background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '15px'}}>
                          <span style={{fontWeight: '700'}}>#{order.id.slice(0, 10).toUpperCase()}</span>
                          <span style={{color: '#64748b', fontSize: '0.9rem'}}>{order.createdAt?.toDate().toLocaleDateString()}</span>
                        </div>
                        <div style={{marginBottom: '15px'}}>
                          {order.items.map((item, idx) => (
                            <div key={idx} style={{fontSize: '0.9rem', marginBottom: '4px', color: '#475569'}}>
                              <b>{item.qty}x</b> {item.name}
                            </div>
                          ))}
                        </div>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                          <span style={{background: statusTheme.bg, color: statusTheme.text, padding: '4px 12px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase'}}>
                            {order.status || 'Processing'}
                          </span>
                          <span style={{fontWeight: '900'}}>${Number(order.totalAmount).toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* VIEW: SAVED ADDRESSES */}
          {activeTab === 'addresses' && (
            <div>
              <h2 style={{marginBottom: '10px', fontSize: '2rem'}}>Saved Addresses</h2>
              <p style={{color: '#64748b', marginBottom: '30px'}}>Set your primary delivery location.</p>
              <form onSubmit={handleUpdate} className="form-grid">
                <div className="input-group">
                  <label>Shipping Address</label>
                  <input className="premium-input" type="text" value={profile.address} onChange={(e) => setProfile({...profile, address: e.target.value})} required />
                </div>
                <div style={{display: 'flex', gap: '15px'}}>
                  <div className="input-group" style={{flex: 1}}>
                    <label>City</label>
                    <input className="premium-input" type="text" value={profile.city} onChange={(e) => setProfile({...profile, city: e.target.value})} required />
                  </div>
                  <div className="input-group" style={{flex: 1}}>
                    <label>Postal Code</label>
                    <input className="premium-input" type="text" value={profile.postalCode} onChange={(e) => setProfile({...profile, postalCode: e.target.value})} required />
                  </div>
                </div>
                <button type="submit" className="checkout-btn-main" disabled={saving}>
                  {saving ? "Saving..." : "Save Address"}
                </button>
              </form>
            </div>
          )}

          {/* VIEW: ACCOUNT DETAILS */}
          {activeTab === 'details' && (
            <div>
              <h2 style={{marginBottom: '10px', fontSize: '2rem'}}>Account Details</h2>
              <p style={{color: '#64748b', marginBottom: '30px'}}>Manage your personal identity information.</p>
              <form onSubmit={handleUpdate} className="form-grid">
                <div className="input-group">
                  <label>Full Name</label>
                  <input className="premium-input" type="text" value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})} required />
                </div>
                <div className="input-group">
                  <label>Email Address</label>
                  <input className="premium-input" type="email" value={profile.email} disabled style={{background: '#f8fafc', cursor: 'not-allowed'}} />
                </div>
                <div className="input-group">
                  <label>Phone Number</label>
                  <input className="premium-input" type="tel" value={profile.phone} onChange={(e) => setProfile({...profile, phone: e.target.value})} required />
                </div>
                <button type="submit" className="checkout-btn-main" disabled={saving}>
                  {saving ? "Saving..." : "Update Details"}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default Profile;