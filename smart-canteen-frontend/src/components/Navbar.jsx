import React from 'react';

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button style={{ 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer',
            color: '#6b7280',
            padding: '8px',
            borderRadius: '6px'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M4 6h16M4 12h16M4 18h16" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          
          <div className="search-container">
            <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              type="search"
              placeholder="Search transactions, items or customers"
              className="search-input"
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button style={{
            position: 'relative',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#6b7280'
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" 
                strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              width: '18px',
              height: '18px',
              background: '#ef4444',
              color: 'white',
              borderRadius: '50%',
              fontSize: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              3
            </span>
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '600',
              color: 'white',
              fontSize: '16px'
            }}>
              O
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '600' }}>Owner</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Admin</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}