import React, { useEffect, useState } from 'react';

export default function DepartRegister() {
  const [data, setData] = useState([]);
  const [arriveeData, setArriveeData] = useState([]);  // store arrivee records
  const [search, setSearch] = useState('');
  const [destinataire, setDestinataire] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [linkedArriveeId, setLinkedArriveeId] = useState('');


  useEffect(() => {
    fetchData();
    fetchArriveeData();
  }, []);

  const fetchData = () => {
    fetch('http://localhost:5000/api/depart')
      .then(res => res.json())
      .then(json => setData(json.data))
      .catch(console.error);
  };

  const fetchArriveeData = () => {
    fetch('http://localhost:5000/api/arrivee')
      .then(res => res.json())
      .then(json => setArriveeData(json.data))
      .catch(console.error);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/depart/${id}`, { method: 'DELETE' });
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
  if (!destinataire || !file) {
    alert("Please fill destinataire and select a file.");
    return;
  }

    console.log('Sending:', destinataire, file); 

  setLoading(true);
  const formData = new FormData();
  formData.append('destinataire', destinataire);
  formData.append('file', file);

  try {
    const res = await fetch('http://localhost:5000/api/depart', {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();

      // If an Arrivee was selected, link it now
      if (linkedArriveeId) {
        await linkArriveeToDepart(data.id, linkedArriveeId);
      }

      setDestinataire('');
      setFile(null);
      setLinkedArriveeId('');
      fetchData();
    } else {
      alert('Failed to add depart');
    }
  } catch (err) {
    console.error(err);
    alert('Error adding depart');
  }
  setLoading(false);
};


  // Filter depart data by search term
  const filteredData = data.filter(item =>
    item.id.toString().includes(search) ||
    (item.destinataire && item.destinataire.toLowerCase().includes(search.toLowerCase())) ||
    (item.date && item.date.includes(search))
  );

  // Helper: get linked arrivee file path by linked_arrivee_id
  const getArriveeFilePath = (linkedArriveeId) => {
    if (!linkedArriveeId) return null;
    const linkedArrivee = arriveeData.find(a => a.id === linkedArriveeId);
    return linkedArrivee ? linkedArrivee.file_path : null;
  };



  // Function to link an Arrivee to a Depart by IDs
async function linkArriveeToDepart(departId, arriveeId) {
  try {
    const response = await fetch(`http://localhost:5000/api/depart/link/${departId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ arriveeId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to link Arrivee to Depart');
    }

    const result = await response.json();
    console.log(result.message);  // "Depart X linked to Arrivee Y"
    // You can add UI feedback here (toast, alert, update state...)
  } catch (error) {
    console.error('Linking error:', error);
  }
}


  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#e6f2ff',
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
          <h2 className="mb-4">Registre de depart</h2>

          {/* Form */}
        <form onSubmit={handleSubmit} className="row g-3 mb-4">
          <div className="col-md-3">
            <input
              type="text"
              className="form-control"
              name="file"  
              placeholder="Destinataire"
              value={destinataire}
              onChange={e => setDestinataire(e.target.value)}
            />
          </div>

          <div className="col-md-3">
            <select
              className="form-control"
              value={linkedArriveeId}
              onChange={e => setLinkedArriveeId(e.target.value)}
            >
              <option value="">Select linked Arrivee (optional)</option>
              {arriveeData.map(arr => (
                <option key={arr.id} value={arr.id}>
                  {`ID: ${arr.id} - ${arr.emetteur || 'No name'}`}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-3">
            <input
              type="file"
              className="form-control"
              onChange={e => setFile(e.target.files[0])}
            />
          </div>

          <div className="col-md-3">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Uploading...' : 'Add Depart'}
            </button>
          </div>
        </form>


          {/* Search */}
          <input
            type="text"
            className="form-control mb-4"
            placeholder="Search by ID, destinataire, or date"
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
                  <th>Destinataire</th>
                  <th>Depart File</th>
                  <th>Arrivee File</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map(item => {
                  const arriveeFile = getArriveeFilePath(item.linked_arrivee_id);
                  return (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.date}</td>
                      <td>{item.destinataire}</td>
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
                      <td>
                        {arriveeFile ? (
                          <a
                            href={`http://localhost:5000/uploads/${arriveeFile}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-decoration-underline text-info"
                            title="Linked Arrivee File"
                          >
                            📄 View Linked Arrivee File
                          </a>
                        ) : '-'}
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(item.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center text-muted py-4">
                      No records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
