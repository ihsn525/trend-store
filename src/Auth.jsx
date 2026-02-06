import React, { useState } from 'react';
import { auth, googleProvider, db } from './firebase'; // Added db import
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'; // Added Firestore methods

function Auth({ onAuthSuccess, onBack }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  // Helper function to sync user data to Firestore
  const syncUserToFirestore = async (user, additionalData = {}) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        displayName: user.displayName || name,
        email: user.email,
        photoURL: user.photoURL || '',
        lastLogin: serverTimestamp(),
        ...additionalData
      }, { merge: true }); // merge: true preserves existing fields like shipping addresses
    } catch (err) {
      console.error("Error syncing user to Firestore:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        await syncUserToFirestore(userCredential.user);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        await syncUserToFirestore(userCredential.user, { createdAt: serverTimestamp() });
      }
      onAuthSuccess();
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    }
  };

  const handleGoogleClick = async () => {
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // Sync Google user data to Firestore
      await syncUserToFirestore(result.user);
      onAuthSuccess();
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError("Sign-in cancelled.");
      } else {
        setError(err.message.replace("Firebase: ", ""));
      }
    }
  };

  return (
    <div className="checkout-container">
      <div className="checkout-card auth-card">
        <button className="back-link" onClick={onBack}>← Back to Store</button>
        
        <div className="auth-header">
          <h1>{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
          <p>{isLogin ? 'Enter your details to access your boutique bag.' : 'Join TrendStore for a premium shopping experience.'}</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="form-grid">
          {!isLogin && (
            <input 
              required
              type="text" 
              placeholder="Full Name" 
              className="premium-input" 
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          <input 
            required
            type="email" 
            placeholder="Email Address" 
            className="premium-input" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input 
            required
            type="password" 
            placeholder="Password" 
            className="premium-input" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          
          <button type="submit" className="checkout-btn-main">
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="divider"><span>OR</span></div>

        <button 
          type="button" 
          className="google-btn" 
          onClick={handleGoogleClick}
        >
          <img 
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
            alt="Google" 
          />
          Continue with Google
        </button>

        <p className="auth-toggle">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
          <span onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Sign Up' : 'Login'}
          </span>
        </p>
      </div>
    </div>
  );
}

export default Auth;