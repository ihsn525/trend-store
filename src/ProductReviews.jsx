import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';

function ProductReviews({ productId, user, onSubmitReview }) {
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "reviews"),
      where("productId", "==", productId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [productId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmitReview(productId, rating, comment);
    setComment("");
    setRating(5);
  };

  return (
    <div className="reviews-section">
      <h3>Reviews ({reviews.length})</h3>
      
      {user ? (
        <form onSubmit={handleSubmit} className="review-form">
          <div className="star-selector">
            {[1, 2, 3, 4, 5].map((num) => (
              <span 
                key={num} 
                className={`star ${num <= rating ? 'active' : ''}`}
                onClick={() => setRating(num)}
              >
                ★
              </span>
            ))}
          </div>
          <textarea 
            placeholder="What did you think of this product?" 
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            required
          />
          <button type="submit" className="add-btn-premium">Post Review</button>
        </form>
      ) : (
        <p className="login-prompt">Please login to write a review.</p>
      )}

      <div className="reviews-list">
        {loading ? <p>Loading...</p> : reviews.map(rev => (
          <div key={rev.id} className="review-item">
            <div className="review-header">
              <span className="review-stars">{"★".repeat(rev.rating)}{"☆".repeat(5-rev.rating)}</span>
              <span className="review-user">{rev.userName}</span>
            </div>
            <p className="review-text">{rev.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProductReviews;