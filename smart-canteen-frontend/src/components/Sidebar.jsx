import React from 'react';
import { NavLink } from 'react-router-dom';

const menu = [
  { name: 'Dashboard', to: '/dashboard', icon: '📊' },
  { name: 'Customers', to: '/customers', icon: '👥' },
  { name: 'Products', to: '/products', icon: '📦' },
  { name: 'Inventory', to: '/inventory', icon: '📋' },
  // { name: 'Sales', to: '/sales', icon: '💰' },
  // { name: 'Invoices', to: '/invoices', icon: '🧾' },
];

export default function Sidebar() {
  return (
    <div className="sidebar">
      <div className="logo">
        <h1>Smart Canteen</h1>
        <p>Sales & Inventory</p>
      </div>

      <nav className="nav-menu">
        {menu.map((m) => (
          <NavLink
            key={m.to}
            to={m.to}
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''}`
            }
          >
            <span>{m.icon}</span>
            <span>{m.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Profile */}
      <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid #374151' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '600',
            color: 'white'
          }}>
            O
          </div>
          <div>
            <div style={{ fontWeight: '600', fontSize: '14px' }}>Owner</div>
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>owner@smartcanteen.com</div>
          </div>
        </div>
      </div>
    </div>
  );
}