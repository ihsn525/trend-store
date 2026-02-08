import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  writeBatch, // Added for migration
  serverTimestamp 
} from 'firebase/firestore';

function AdminDashboard({ onBack }) {
  // ... existing states (products, orders, etc.)

  // --- TEMPORARY MIGRATION FUNCTION ---
  const [isMigrating, setIsMigrating] = useState(false);

  const addStockToAllProducts = async () => {
    if (!window.confirm("This will add 'stock: 20' to every product in your database. Continue?")) return;
    
    setIsMigrating(true);
    try {
      const querySnapshot = await getDocs(collection(db, "products"));
      const batch = writeBatch(db);

      querySnapshot.docs.forEach((productDoc) => {
        const docRef = doc(db, "products", productDoc.id);
        // .update ensures we don't overwrite the whole document, just add/change the 'stock' field
        batch.update(docRef, { stock: 20 });
      });

      await batch.commit();
      alert("Success! All products now have stock tracking. ✅");
    } catch (error) {
      console.error("Migration Error:", error);
      alert("Migration failed. Check console.");
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="admin-container" style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* --- MIGRATION TOOLBAR (Remove this after running once) --- */}
      <div style={{ 
        background: '#fff4f4', 
        border: '1px solid #ffc1c1', 
        padding: '20px', 
        borderRadius: '15px', 
        marginBottom: '30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h4 style={{ margin: 0, color: '#d32f2f' }}>Database Migration Tool</h4>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>Run this once to add the 'stock' field to all existing items.</p>
        </div>
        <button 
          onClick={addStockToAllProducts}
          disabled={isMigrating}
          style={{
            background: '#d32f2f',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          {isMigrating ? "Migrating..." : "Run Stock Migration"}
        </button>
      </div>

      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '900' }}>Admin Portal</h1>
        <button className="back-link" onClick={onBack}>← Back to Store</button>
      </header>

      {/* Your existing Admin Tabs (Orders/Inventory) and Form go here */}
      {/* Make sure your "Add Product" form now includes a stock input field! */}
      
    </div>
  );
}

export default AdminDashboard;