import React from 'react';

export default function SimpleCard({ title, value, children }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      {children}
    </div>
  );
}
