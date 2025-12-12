import React, { useEffect, useState } from 'react';
import { getLowStock, getItems } from '../services/api';
import SimpleTable from '../components/SimpleTable';

export default function Inventory() {
  const [low, setLow] = useState([]);
  const [all, setAll] = useState([]);

  useEffect(() => {
    getLowStock().then(setLow).catch(() => setLow([]));
    getItems().then(setAll).catch(() => setAll([]));
  }, []);

  const columns = [
    { key: 'name', title: 'Name' },
    { key: 'stock', title: 'Stock' },
    { key: 'reorder_threshold', title: 'Reorder' },
  ];

  return (
    <div style={{ padding: '10px 20px' }}>
      <h2 className="text-2xl font-semibold mb-4">Inventory</h2>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded shadow p-4">
          <h3 className="font-medium mb-3">Low stock</h3>
          <SimpleTable columns={columns} data={low} />
        </div>
        <div className="bg-white rounded shadow p-4">
          <h3 className="font-medium mb-3">All items</h3>
          <SimpleTable columns={columns} data={all} />
        </div>
      </div>
    </div>
  );
}
