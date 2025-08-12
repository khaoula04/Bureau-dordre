import React, { useEffect, useState } from 'react';

export default function ArriveeRegister() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [emetteur, setEmetteur] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    fetch('http://localhost:5000/api/arrivee')
      .then(res => res.json())
      .then(json => setData(json.data))
      .catch(console.error);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/arrivee/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setData(data.filter(item => item.id !== id));
      } else {
        alert("Failed to delete");
      }
    } catch (error) {
      console.error(error);
      alert("Error deleting record");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emetteur || !file) {
      alert("Please fill emetteur and select a file.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('emetteur', emetteur);
    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:5000/api/arrivee', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        setEmetteur('');
        setFile(null);
        fetchData();
      } else {
        alert('Failed to add arrivee');
      }
    } catch (err) {
      console.error(err);
      alert('Error adding arrivee');
    }
    setLoading(false);
  };

  // New function to link an arrivee record to a depart ID
const handleLinkDepart = async (arriveeId, departId) => {
  if (!departId || isNaN(departId)) {
    alert('Please enter a valid Depart ID');
    return;
  }
  try {
    const res = await fetch(`http://localhost:5000/api/depart/link/${departId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ arriveeId }),
    });
    if (res.ok) {
      fetchData(); // refresh arrivee data
    } else {
      alert('Failed to link depart');
    }
  } catch (error) {
    console.error(error);
    alert('Error linking depart');
  }
};


  const filteredData = data.filter(item =>
    item.id.toString().includes(search) ||
    (item.emetteur && item.emetteur.toLowerCase().includes(search.toLowerCase())) ||
    (item.date && item.date.includes(search))
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#e6f2ff', // light blue background
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingTop: '40px',
        paddingBottom: '40px',
        width: '100vw',
        boxSizing: 'border-box',
      }}
    >
      <div
        className="card shadow"
        style={{
          width: '100%',
          maxWidth: '900px',
          backgroundColor: 'white',
        }}
      >
        <div className="card-body">
          <h2 className="mb-4">Registre d'arrivee</h2>

          {/* Form */}
          <form onSubmit={handleSubmit} className="row g-3 mb-4">
            <div className="col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="Emetteur"
                value={emetteur}
                onChange={e => setEmetteur(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <input
                type="file"
                className="form-control"
                onChange={e => setFile(e.target.files[0])}
              />
            </div>
            <div className="col-md-4">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Uploading...' : 'Add Arrivee'}
              </button>
            </div>
          </form>

          {/* Search */}
          <input
            type="text"
            className="form-control mb-4"
            placeholder="Search by ID, emetteur, or date"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          {/* Table */}
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-primary">
                <tr>
                  <th>ID</th>
                  <th>Date</th>
                  <th>Emetteur</th>
                  <th>File</th>
                  <th>Alert</th>
                  <th>Linked Depart ID</th>
                  <th>Actions</th>
                </tr>
              </thead>
             <tbody>
  {filteredData.map(item => (
    <tr key={item.id}>
      <td>{item.id}</td>
      <td>{item.date}</td>
      <td>{item.emetteur}</td>
      <td>
        {item.file_path ? (
          <a
            href={`http://localhost:5000/uploads/${item.file_path}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-decoration-underline text-primary"
          >
            📄 View File
          </a>
        ) : '-'}
      </td>
      <td className="text-center">
        {(item.linked_depart_id == null) ? (
          <span className="text-danger font-weight-bold" title="No linked depart">⚠️</span>
        ) : (
          <span>✅</span>
        )}
      </td>
      <td>{item.linked_depart_id || '-'}</td>

      {/* Removed input for linking here */}

      <td>
        <button
          className="btn btn-sm btn-danger"
          onClick={() => handleDelete(item.id)}
        >
          Delete
        </button>
      </td>
    </tr>
  ))}
</tbody>

            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
