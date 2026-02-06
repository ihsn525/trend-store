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
  const [profile, setProfile] = useState({
    address: '',
    city: '',
    phone: '',
    postalCode: ''
  });

  const user = auth.currentUser;

  // Helper function to style status tags dynamically
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
          const ordersList = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setOrders(ordersList);

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
      alert("Profile updated successfully! ✨");
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loader">Loading your account...</div>;

  return (
    <div className="checkout-container">
      <div className="checkout-card">
        <button className="back-link" onClick={onBack}>← Back to Store</button>
        
        <div className="auth-header" style={{textAlign: 'left', marginBottom: '30px'}}>
          <h1 style={{fontSize: '2.5rem', fontWeight: '900'}}>Account Settings</h1>
          <p>Manage your saved addresses and track your recent orders.</p>
        </div>

        <form onSubmit={handleUpdate} className="form-grid">
          <div className="input-group">
            <label>Shipping Address</label>
            <input 
              className="premium-input" 
              type="text" 
              placeholder="Street Address"
              value={profile.address}
              onChange={(e) => setProfile({...profile, address: e.target.value})}
              required
            />
          </div>

          <div className="row">
            <div className="input-group" style={{flex: 1}}>
                <label>City</label>
                <input 
                  className="premium-input" 
                  type="text" 
                  placeholder="City"
                  value={profile.city}
                  onChange={(e) => setProfile({...profile, city: e.target.value})}
                  required
                />
            </div>
            <div className="input-group" style={{flex: 1}}>
                <label>Postal Code</label>
                <input 
                  className="premium-input" 
                  type="text" 
                  placeholder="Postal Code"
                  value={profile.postalCode}
                  onChange={(e) => setProfile({...profile, postalCode: e.target.value})}
                  required
                />
            </div>
          </div>

          <div className="input-group">
            <label>Phone Number</label>
            <input 
                className="premium-input" 
                type="tel" 
                placeholder="Phone Number"
                value={profile.phone}
                onChange={(e) => setProfile({...profile, phone: e.target.value})}
                required
            />
          </div>

          <button type="submit" className="checkout-btn-main" disabled={saving}>
            {saving ? "Saving..." : "Update Shipping Profile"}
          </button>
        </form>

        <div className="divider" style={{margin: '60px 0'}}><span>Order History</span></div>

        <div className="order-history-section">
          {orders.length === 0 ? (
            <div className="empty-state">
              <p>You haven't placed any orders yet.</p>
              <button onClick={onBack} className="back-to-step" style={{textDecoration: 'none', background: 'var(--primary)', color: 'white', padding: '10px 20px', borderRadius: '12px', marginTop: '10px'}}>Start Shopping</button>
            </div>
          ) : (
            <div className="order-list" style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
              {orders.map(order => {
                const statusTheme = getStatusStyle(order.status);
                return (
                  <div key={order.id} className="order-item-card" style={{background: '#fff', padding: '25px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '15px'}}>
                      <div>
                        <p style={{fontSize: '0.75rem', fontWeight: '800', color: 'var(--gray)', textTransform: 'uppercase', marginBottom: '4px'}}>Order Number</p>
                        <span style={{fontWeight: '700', color: 'var(--dark)'}}>#{order.id.slice(0, 10).toUpperCase()}</span>
                      </div>
                      <div style={{textAlign: 'right'}}>
                        <p style={{fontSize: '0.75rem', fontWeight: '800', color: 'var(--gray)', textTransform: 'uppercase', marginBottom: '4px'}}>Date Placed</p>
                        <span style={{fontWeight: '600', color: 'var(--slate)'}}>{order.createdAt?.toDate().toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div style={{marginBottom: '20px'}}>
                      {order.items.map((item, idx) => (
                        <div key={idx} style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.95rem'}}>
                          <span style={{color: 'var(--slate)'}}><b style={{color: 'var(--primary)'}}>{item.qty}x</b> {item.name}</span>
                          <span style={{fontWeight: '600'}}>${(item.price * item.qty).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '15px', borderRadius: '16px'}}>
                      <span style={{
                        background: statusTheme.bg, 
                        color: statusTheme.text, 
                        padding: '6px 14px', 
                        borderRadius: '100px', 
                        fontSize: '0.75rem', 
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        {order.status || 'Processing'}
                      </span>
                      <div style={{textAlign: 'right'}}>
                        <span style={{fontSize: '0.8rem', color: 'var(--gray)', fontWeight: '600', display: 'block'}}>Total Amount</span>
                        <span style={{fontWeight: '900', fontSize: '1.2rem', color: 'var(--dark)'}}>${Number(order.totalAmount).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;