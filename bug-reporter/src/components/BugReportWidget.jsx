// BugReportWidget.jsx
import React, { useState, useRef } from "react";
import axios from "axios";
import './BugReportWidget.css';

const BugReportWidget = ({ apiUrl }) => {
  const [isOpen, setIsOpen] = useState(false);
  // Button position (bottom, right distances in px)
  const [buttonPos, setButtonPos] = useState({ bottom: 24, right: 24 });
  const dragData = useRef({ dragging: false, hasDragged: false, startX: 0, startY: 0, startBottom: 0, startRight: 0 });

  // Drag event handlers
  function onButtonMouseDown(e) {
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragData.current = {
      dragging: true,
      hasDragged: false,
      startX: clientX,
      startY: clientY,
      startBottom: buttonPos.bottom,
      startRight: buttonPos.right,
    };
    document.addEventListener('mousemove', onButtonMouseMove);
    document.addEventListener('mouseup', onButtonMouseUp);
    document.addEventListener('touchmove', onButtonMouseMove);
    document.addEventListener('touchend', onButtonMouseUp);
  }

  function onButtonMouseMove(e) {
    if (!dragData.current.dragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    // Get window size so we don't go out of bounds
    const winW = window.innerWidth;
    const winH = window.innerHeight;
    // Button size for bounds enforcement
    const btnSize = 60;
    const dx = clientX - dragData.current.startX;
    const dy = clientY - dragData.current.startY;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      dragData.current.hasDragged = true;
    }
    let nextRight = dragData.current.startRight - dx;
    let nextBottom = dragData.current.startBottom - dy;
    // Keep within viewport
    nextRight = Math.max(4, Math.min(winW - btnSize - 4, nextRight));
    nextBottom = Math.max(4, Math.min(winH - btnSize - 4, nextBottom));
    setButtonPos({ bottom: nextBottom, right: nextRight });
  }

  function onButtonMouseUp() {
    dragData.current.dragging = false;
    document.removeEventListener('mousemove', onButtonMouseMove);
    document.removeEventListener('mouseup', onButtonMouseUp);
    document.removeEventListener('touchmove', onButtonMouseMove);
    document.removeEventListener('touchend', onButtonMouseUp);
  }

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("Medium");
  const [category, setCategory] = useState("Bug Report");
  const [email, setEmail] = useState("");
  const [image, setImage] = useState(null);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => { 
    e.preventDefault();
    if (isSubmitting) return;

    if (!title || !description) {
      setMessage("⚠️ Title and description are required.");
      return;
    }

    if (!apiUrl) {
      setMessage("⚠️ Configuration Error: Missing apiUrl prop.");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("severity", severity);
    formData.append("category", category);
    formData.append("email", email);
    if (image) formData.append("image", image);

    try {
      await axios.post(apiUrl, formData);
      setMessage("✅ Bug report submitted successfully!");
      setTitle("");
      setDescription("");
      setSeverity("Medium");
      setCategory("Bug Report");
      setEmail("");
      setImage(null);
      setIsOpen(false);
    } catch (err) {
      console.error("❌ Error:", err);
      setMessage("❌ Failed to submit bug report.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          aria-label="Open bug report form"
          className="bug-widget-button"
          style={{
            position: 'fixed',
            bottom: buttonPos.bottom,
            right: buttonPos.right,
            width: 60,
            height: 60,
            zIndex: 1000 
          }}
          onClick={(e) => {
            if (dragData.current.hasDragged) {
              e.preventDefault();
              return;
            }
            setIsOpen(true);
          }}
          onMouseDown={onButtonMouseDown}
          onTouchStart={onButtonMouseDown}
        >
          🐞
        </button>
      )}

      {/* Widget Modal */}
      {isOpen && (
        <div className="bug-widget-overlay" onClick={() => setIsOpen(false)}>
          <div className="bug-widget-modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
            <div className="bug-widget-header">
              <h2>Report a Bug</h2>
              <button className="bug-widget-close" onClick={() => setIsOpen(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            {/* Success/Error/Regular Form */}
            {message && (
              <div className="bug-widget-message">
                <p>{message}</p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="bug-widget-form">
              <div className="bug-widget-field">
                <label>Title *</label>
                <input
                  type="text"
                  placeholder="Brief description of the issue"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="bug-widget-input"
                />
              </div>

              <div className="bug-widget-field">
                <label>Description *</label>
                <textarea
                  placeholder="Please describe the issue in detail..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={6}
                  className="bug-widget-textarea"
                />
              </div>

              <div className="bug-widget-row">
                <div className="bug-widget-field">
                  <label>Severity</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="bug-widget-select"
                  >
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div className="bug-widget-field">
                  <label>Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="bug-widget-select"
                  >
                    <option value="Bug Report">Bug Report</option>
                    <option value="UI">UI</option>
                    <option value="Performance">Performance</option>
                    <option value="Crash">Crash</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="bug-widget-field">
                <label>Email (optional)</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bug-widget-input"
                />
              </div>

              <div className="bug-widget-field">
                <label>Screenshot (optional)</label>
                <div className="bug-widget-screenshot">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImage(e.target.files[0])}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (event) => {
                        setImage(event.target.files[0]);
                      };
                      input.click();
                    }}
                    className="bug-widget-upload"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7,10 12,15 17,10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Upload Image
                  </button>
                </div>
                {image && (
                  <div className="bug-widget-preview">
                    <span>Screenshot attached ✓</span>
                  </div>
                )}
              </div>

              <div className="bug-widget-actions">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="bug-widget-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bug-widget-submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default BugReportWidget;