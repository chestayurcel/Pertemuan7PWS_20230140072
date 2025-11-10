const express = require('express');
const path = require('path');
const app = express();
const crypto = require('crypto');
const port = 3000;
const mysql = require('mysql2'); 

const db = mysql.createConnection({
    host: 'localhost',
    port: 3308,
    user: 'root', 
    password: 'chstmysql8', 
    database: 'apikey_db' 
}).promise();


app.use(express.static(path.join(__dirname, 'public')));


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/keys', async (req, res) => {
    try {
        const keys = await getAllKeys();
        
        // Kirim semua data key dalam format JSON
        res.json({ 
            success: true,
            total: keys.length,
            api_keys: keys 
        });
    } catch (error) {
        console.error('Error saat mengambil API keys:', error);
        
        // Kirim respons error 500 jika terjadi kegagalan database
        res.status(500).json({ 
            success: false,
            error: 'Gagal mengambil daftar API Keys dari database.' 
        });
    }
});

// 3. Rute POST diubah untuk menggunakan async/await dan error handling
app.post('/create', async (req, res) => { // Tambahkan 'async'
    try {
        const key = crypto.randomBytes(16).toString('hex');
        
        // Perhatikan penulisan fungsi yang benar: saveKey
        await saveKey(key); 
        
        // Hanya merespons sukses jika penyimpanan berhasil
        res.json({ apikey: key });

    } catch (error) {
        console.error('Error saat membuat atau menyimpan API key:', error);
        
        // Mengirim respons status 500 ke klien jika terjadi error
        // agar klien bisa menampilkan pesan kesalahan (response.ok akan false)
        res.status(500).json({ error: 'Gagal membuat atau menyimpan API Key.' });
    }
});

async function getAllKeys() {
    // Query untuk mengambil semua kolom dari tabel api_keys
    const sql = 'SELECT id, key_value, created_at FROM api_keys ORDER BY created_at DESC';
    // db adalah koneksi promise, [rows, fields] adalah hasil destructuring dari db.query
    const [rows] = await db.query(sql); 
    return rows;
}

// 4. Fungsi saveKey diubah untuk menggunakan koneksi berbasis Promise (dari mysql2.promise())
async function saveKey(key) {
    // Fungsi ini sekarang async dan langsung mengembalikan hasil query
    const sql = 'INSERT INTO api_keys (key_value, created_at) VALUES (?, NOW())';
    // db adalah koneksi promise, jadi query adalah async/await
    const [result] = await db.query(sql, [key]);
    return result;
}

app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});