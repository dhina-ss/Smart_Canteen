import React, { useEffect, useState } from 'react';
import { getCustomers } from '../services/api';
import SimpleTable from '../components/SimpleTable';

export default function Customers() {
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    getCustomers().then(setCustomers).catch(() => setCustomers([]));
  }, []);

  const columns = [
    { key: 'name', title: 'Name' },
    { key: 'phone', title: 'Phone' },
    { key: 'email', title: 'Email' },
  ];

  return (
    <div style={{ padding: '10px 20px' }}>
      <h2 className="text-2xl font-semibold mb-4">Customers</h2>
      <SimpleTable columns={columns} data={customers} />
    </div>
  );
}
