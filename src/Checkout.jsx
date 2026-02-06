import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';

function Checkout({ cart, total, onBack, onOrderSuccess }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    address: '',
    city: '',
    postalCode: '',
    phone: ''
  });

  const user = auth.currentUser;

  // 1. Fetch saved address from Profile on load
  useEffect(() => {
    const fetchSavedAddress = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setFormData({
              address: data.address || '',
              city: data.city || '',
              postalCode: data.postalCode || '',
              phone: data.phone || ''
            });
          }
        } catch (err) {
          console.error("Error fetching address:", err);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchSavedAddress();
  }, [user]);

  // 2. Handle Order Submission
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setProcessing(true);

    try {
      // Create Order Object
      const orderData = {
        userId: user.uid,
        customerName: user.displayName || user.email,
        items: cart,
        totalAmount: total,
        shippingDetails: formData,
        status: 'Processing',
        createdAt: serverTimestamp()
      };

      // Save to Firestore 'orders' collection
      const docRef = await addDoc(collection(db, "orders"), orderData);
      
      // Trigger success (this will clear cart in App.jsx)
      onOrderSuccess({ id: docRef.id, ...orderData });
      
    } catch (err) {
      console.error("Order Error:", err);
      alert("Something went wrong with your order.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="loader">Securing checkout...</div>;

  return (
    <div className="checkout-container">
      <div className="checkout-card">
        <button className="back-link" onClick={onBack}>← Back to Bag</button>
        
        <div className="steps-indicator">
          <span className={`step ${step >= 1 ? 'active' : ''}`}>Shipping</span>
          <div className="step-line"></div>
          <span className={`step ${step === 2 ? 'active' : ''}`}>Payment</span>
        </div>

        <div className="checkout-layout">
          {/* LEFT SIDE: FORMS */}
          <div className="form-section">
            {step === 1 ? (
              <form onSubmit={() => setStep(2)} className="form-grid">
                <h2>Shipping Details</h2>
                <p style={{marginBottom: '20px', color: 'var(--gray)'}}>Confirm where we should send your order.</p>
                
                <input 
                  className="premium-input" 
                  placeholder="Address" 
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  required 
                />
                <div className="form-row">
                  <input 
                    className="premium-input" 
                    placeholder="City" 
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    required 
                  />
                  <input 
                    className="premium-input" 
                    placeholder="Postal Code" 
                    value={formData.postalCode}
                    onChange={(e) => setFormData({...formData, postalCode: e.target.value})}
                    required 
                  />
                </div>
                <input 
                  className="premium-input" 
                  placeholder="Phone" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  required 
                />
                <button type="submit" className="checkout-btn-main">Continue to Payment</button>
              </form>
            ) : (
              <div className="payment-form">
                <h2>Secure Payment</h2>
                <div className="stripe-placeholder">
                  <div className="card-icon">💳</div>
                  <p>Stripe Integration Ready</p>
                  <small>Card: **** **** **** 4242</small>
                </div>
                <button 
                  className="checkout-btn-main" 
                  onClick={handlePlaceOrder}
                  disabled={processing}
                >
                  {processing ? "Processing..." : `Pay $${total.toFixed(2)}`}
                </button>
                <button className="back-to-step" onClick={() => setStep(1)}>Edit Shipping</button>
              </div>
            )}
          </div>

          {/* RIGHT SIDE: SUMMARY */}
          <div className="order-summary">
            <h3>Order Summary</h3>
            <div className="summary-items">
              {cart.map(item => (
                <div key={item.id} className="summary-item">
                  <span>{item.qty}x {item.name}</span>
                  <span>${(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="summary-total">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;