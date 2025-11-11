# Mode Offline Single-Player

Game ini telah diubah menjadi **offline single-player mode**. Game tidak lagi memerlukan server atau koneksi internet untuk berfungsi setelah di-deploy.

## Perubahan yang Dibuat

### 1. Socket.IO Dihapus
- Semua koneksi Socket.IO telah dihapus dari frontend
- Game tidak lagi mengirim data ke server
- Tidak ada lagi fitur multiplayer atau chat online

### 2. Avatar Selection
- Avatar selection sekarang menggunakan **localStorage** saja
- Tidak perlu koneksi ke server untuk memilih avatar
- Avatar selection tersimpan di browser user

### 3. Single-Player Only
- Game hanya bisa dimainkan oleh 1 player
- Tidak ada lagi fitur untuk melihat player lain
- Tidak ada lagi synchronisasi posisi dengan server

### 4. Offline Capable
- Game dapat berjalan sepenuhnya offline setelah di-deploy
- Semua assets dimuat dari folder `dist/` dan `public/`
- Tidak memerlukan server backend untuk berfungsi

## Cara Deploy sebagai Static Site

Game sekarang dapat di-deploy sebagai static site tanpa perlu server Node.js:

### 1. Build Game
```bash
npm run frontend-build
```

### 2. Deploy Folder `dist/`
- Upload folder `dist/` ke hosting static (Netlify, Vercel, GitHub Pages, dll)
- Atau serve folder `dist/` menggunakan web server apapun (nginx, Apache, dll)

### 3. Tidak Perlu Server
- File `server.js` tidak diperlukan lagi untuk menjalankan game
- Game akan berfungsi sepenuhnya dari folder `dist/`

## File yang Dimodifikasi

1. **frontend/index.js**
   - Menghapus import Socket.IO
   - Menghapus semua socket connections
   - Menghapus chat functionality

2. **frontend/Experience/Experience.js**
   - Menghapus parameter socket dari constructor
   - Socket diset ke null

3. **frontend/Experience/World/Player/Player.js**
   - Menghapus semua socket event listeners
   - Menghapus updatePlayerSocket() method
   - Menghapus otherPlayers logic
   - Menambahkan createPlayerAvatar() method untuk offline mode
   - Menambahkan setAvatarFromLocalStorage() method

4. **frontend/Experience/Preloader.js**
   - Menghapus socket.emit() calls
   - Menggunakan createPlayerAvatar() langsung dari Player instance
   - Avatar selection disimpan ke localStorage

## Fitur yang Masih Berfungsi

✅ Gameplay single-player
✅ Avatar selection (male/female)
✅ Scene transitions
✅ Dialog system
✅ NPC interactions
✅ Story progression
✅ Score system
✅ Sound effects
✅ Controls (WASD, mouse, joystick)

## Fitur yang Dihapus

❌ Multiplayer (player lain)
❌ Online chat
❌ Server synchronization
❌ Real-time player updates

## Testing

Untuk test game secara lokal tanpa server:

1. Build game: `npm run frontend-build`
2. Serve folder `dist/` menggunakan static file server:
   ```bash
   # Menggunakan Python
   cd dist
   python -m http.server 8000
   
   # Menggunakan Node.js (http-server)
   npx http-server dist -p 8000
   ```
3. Buka browser ke `http://localhost:8000`
4. Game akan berfungsi sepenuhnya offline

## Catatan

- Game masih menggunakan beberapa dependencies yang tidak diperlukan (socket.io, express) di package.json
- Dependencies tersebut tidak mempengaruhi fungsi game dalam mode offline
- Untuk mengurangi ukuran bundle, dependencies tersebut bisa dihapus di masa depan
- Server.js masih ada di repository tetapi tidak diperlukan untuk menjalankan game

