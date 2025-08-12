const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();
const PORT = 5000;
const multer = require('multer');
const path = require('path');

app.use(cors());
app.use(express.json());
// to delete files from the folder
const fs = require('fs');



app.use('/uploads', express.static(path.join(__dirname, 'uploads')));




const db = new sqlite3.Database('./bureau.db', (err) => {
    if (err) console.error('Could not connect to database', err);
    else console.log('Connected to SQLite database');
});


const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + file.originalname;
        cb(null, uniqueName);
    }
});

const upload = multer({ storage });


db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS arrivee (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT,
        emetteur TEXT,
        file_path TEXT,
        linked_depart_id INTEGER DEFAULT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS depart (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT,
        destinataire TEXT,
        file_path TEXT,
        linked_arrivee_id INTEGER DEFAULT NULL
    )`);
});

app.get('/', (req, res) => {
    res.send('Hello from Bureau d\'Ordre backend!');
});

app.get('/api/arrivee', (req, res) => {
    db.all("SELECT * FROM arrivee", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ data: rows });
    });
});



app.get('/api/depart', (req, res) => {
    db.all("SELECT * FROM depart", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ data: rows });
    });
});

app.post('/api/depart', (req, res) => {
  upload.single('file')(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // Multer-specific error
      return res.status(400).json({ error: 'File field missing or upload error' });
    } else if (err) {
      // Unknown error
      return res.status(500).json({ error: 'Unknown upload error' });
    }

    const destinataire = req.body.destinataire;
    const date = new Date().toISOString().split('T')[0];

    if (!req.file) {
      return res.status(400).json({ error: 'File is required' });
    }

    const file_path = req.file.filename;

    db.run(
      "INSERT INTO depart (date, destinataire, file_path) VALUES (?, ?, ?)",
      [date, destinataire, file_path],
      function (err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ id: this.lastID });
      }
    );
  });
});


app.post('/api/arrivee', upload.single('file'), (req, res) => {
  const emetteur = req.body.emetteur;
  const date = new Date().toISOString().split('T')[0];

  if (!req.file) {
    return res.status(400).json({ error: 'File is required' });
  }

  if (!emetteur) {
    return res.status(400).json({ error: 'Emetteur is required' });
  }

  const file_path = req.file.filename;

  db.run(
    "INSERT INTO arrivee (date, emetteur, file_path) VALUES (?, ?, ?)",
    [date, emetteur, file_path],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID });
    }
  );
});



// PUT link depart to arrivee
app.put('/api/depart/link/:departId', (req, res) => {
    const departId = req.params.departId;
    const { arriveeId } = req.body;

    // update depart
    db.run(
        "UPDATE depart SET linked_arrivee_id = ? WHERE id = ?",
        [arriveeId, departId],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            // update arrivee
            db.run(
                "UPDATE arrivee SET linked_depart_id = ? WHERE id = ?",
                [departId, arriveeId],
                function (err2) {
                    if (err2) {
                        res.status(500).json({ error: err2.message });
                        return;
                    }

                    res.json({ message: `Depart ${departId} linked to Arrivee ${arriveeId}` });
                }
            );
        }
    );
});

// GET arrivee without linked depart
app.get('/api/arrivee/alerts', (req, res) => {
    db.all("SELECT * FROM arrivee WHERE linked_depart_id IS NULL", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ data: rows });
    });
});

app.delete('/api/arrivee/:id', (req, res) => {
  const id = req.params.id;

  db.run("DELETE FROM arrivee WHERE id = ?", [id], function(err) {
    if (err) {
      console.error('Delete error:', err);
      return res.status(500).json({ error: 'Failed to delete entry' });
    }

    if (this.changes === 0) {
      // No row deleted (id not found)
      return res.status(404).json({ error: 'Entry not found' });
    }

    res.json({ message: 'Entry deleted successfully' });
  });
});


// DELETE /api/depart/:id
/* app.delete('/api/depart/:id', (req, res) => {
  const id = req.params.id;

  db.run("DELETE FROM depart WHERE id = ?", id, function (err) {
    if (err) {
      return res.status(500).json({ error: 'Impossible to delete this entry' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    res.json({ message: 'Entry deleted successfully' });
  });
}); */

app.delete('/api/arrivee/:id', (req, res) => {
  const id = req.params.id;

  // Step 1: get the file_path for that row
  db.get("SELECT file_path FROM arrivee WHERE id = ?", [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    const filePath = path.join(__dirname, 'uploads', row.file_path);

    // Step 2: delete the file from disk
    fs.unlink(filePath, (err) => {
      if (err) {
        // Log the error but don't stop deleting the DB row
        console.error('File delete error:', err);
      }

      // Step 3: delete the row from database
      db.run("DELETE FROM arrivee WHERE id = ?", [id], function (err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to delete entry' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Entry not found' });
        }
        res.json({ message: 'Entry and file deleted successfully' });
      });
    });
  });
});










app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
