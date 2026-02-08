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
  const [activeTab, setActiveTab] = useState('orders'); 
  const [profile, setProfile] = useState({
    name: '',
    email: '',
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
    // FORCED FLEX LAYOUT - This overrides standard CSS flow
    <div id="profile-master-layout" style={{ 
        display: 'flex', 
        flexDirection: 'row', 
        gap: '40px', 
        padding: '40px', 
        maxWidth: '1300px', 
        margin: '0 auto',
        minHeight: '100vh',
        alignItems: 'flex-start'
    }}>
      
      {/* --- SIDEBAR NAV --- */}
      <div style={{ 
          width: '300px', 
          flexShrink: 0, 
          position: 'sticky', 
          top: '20px' 
      }}>
        <button className="back-link" onClick={onBack} style={{ marginBottom: '20px', display: 'block' }}>← Back to Store</button>
        
        <div className="checkout-card" style={{ padding: '15px', borderRadius: '24px' }}>
          <div style={{ padding: '15px 15px 25px 15px' }}>
            <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Settings</h2>
            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '0.85rem' }}>{profile.email}</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button onClick={() => setActiveTab('orders')} style={navButtonStyle(activeTab === 'orders')}>
               <span style={{fontSize: '1.2rem'}}>📦</span> My Orders
            </button>
            <button onClick={() => setActiveTab('addresses')} style={navButtonStyle(activeTab === 'addresses')}>
               <span style={{fontSize: '1.2rem'}}>📍</span> Saved Addresses
            </button>
            <button onClick={() => setActiveTab('details')} style={navButtonStyle(activeTab === 'details')}>
               <span style={{fontSize: '1.2rem'}}>👤</span> Account Details
            </button>
          </div>
        </div>
      </div>

      {/* --- MAIN CONTENT WINDOW --- */}
      <div className="checkout-card" style={{ flex: 1, padding: '50px', borderRadius: '32px', minHeight: '600px' }}>
        
        {activeTab === 'orders' && (
          <div className="order-history-section">
            <h1 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '30px' }}>Order History</h1>
            {orders.length === 0 ? (
              <p>You haven't placed any orders yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                {orders.map(order => {
                  const statusTheme = getStatusStyle(order.status);
                  return (
                    <div key={order.id} style={{ border: '1px solid #f1f5f9', padding: '25px', borderRadius: '24px', background: '#fff' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                        <span style={{ fontWeight: '800' }}>#{order.id.slice(0, 10).toUpperCase()}</span>
                        <span style={{ color: '#94a3b8' }}>{order.createdAt?.toDate().toLocaleDateString()}</span>
                      </div>
                      <div style={{ marginBottom: '20px' }}>
                        {order.items.map((item, idx) => (
                          <div key={idx} style={{ marginBottom: '5px' }}>
                            <b style={{color: 'var(--primary)'}}>{item.qty}x</b> {item.name}
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '15px', borderRadius: '16px' }}>
                         <span style={{ background: statusTheme.bg, color: statusTheme.text, padding: '5px 15px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: '800' }}>
                            {order.status || 'Processing'}
                         </span>
                         <span style={{ fontWeight: '900', fontSize: '1.3rem' }}>${Number(order.totalAmount).toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'addresses' && (
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '10px' }}>Saved Addresses</h1>
            <p style={{ color: '#64748b', marginBottom: '40px' }}>Update your default shipping location.</p>
            <form onSubmit={handleUpdate} className="form-grid">
                <div className="input-group">
                    <label>Street Address</label>
                    <input className="premium-input" type="text" value={profile.address} onChange={(e) => setProfile({...profile, address: e.target.value})} required />
                </div>
                <div style={{ display: 'flex', gap: '20px' }}>
                    <div className="input-group" style={{ flex: 1 }}>
                        <label>City</label>
                        <input className="premium-input" value={profile.city} onChange={(e) => setProfile({...profile, city: e.target.value})} required />
                    </div>
                    <div className="input-group" style={{ flex: 1 }}>
                        <label>Postal Code</label>
                        <input className="premium-input" value={profile.postalCode} onChange={(e) => setProfile({...profile, postalCode: e.target.value})} required />
                    </div>
                </div>
                <button type="submit" className="checkout-btn-main" disabled={saving}>
                    {saving ? "Saving..." : "Update Shipping Profile"}
                </button>
            </form>
          </div>
        )}

        {activeTab === 'details' && (
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '10px' }}>Account Details</h1>
            <p style={{ color: '#64748b', marginBottom: '40px' }}>Manage your profile settings.</p>
            <form onSubmit={handleUpdate} className="form-grid">
                <div className="input-group">
                    <label>Full Name</label>
                    <input className="premium-input" type="text" value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})} required />
                </div>
                <div className="input-group">
                    <label>Email Address</label>
                    <input className="premium-input" value={profile.email} disabled style={{ background: '#f1f5f9', color: '#94a3b8' }} />
                </div>
                <div className="input-group">
                    <label>Phone Number</label>
                    <input className="premium-input" type="tel" value={profile.phone} onChange={(e) => setProfile({...profile, phone: e.target.value})} required />
                </div>
                <button type="submit" className="checkout-btn-main" disabled={saving}>
                    {saving ? "Saving..." : "Save Profile Changes"}
                </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}

// Styling helper for the sidebar buttons
const navButtonStyle = (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 20px',
    border: 'none',
    borderRadius: '16px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: isActive ? '700' : '500',
    background: isActive ? '#eff6ff' : 'transparent',
    color: isActive ? '#2563eb' : '#64748b',
    textAlign: 'left',
    transition: '0.3s'
});

export default Profile;