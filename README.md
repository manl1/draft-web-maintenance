# Dashboard PT Aldzama - React Version

## Cara Setup & Menjalankan

### 1. Install dependencies
```bash
npm install
```

### 2. Pindahkan aset kamu ke folder `public/`
Struktur folder `public/` harus seperti ini:
```
public/
├── images/
│   ├── background.jpg
│   ├── logo-azm.png
│   ├── logo-azm.ico
│   └── dropdown.svg
└── fonts/
    └── gotham-bold.otf
```

> ⚠️ Di React + Vite, folder `public/` menggantikan `static/`.
> Semua file yang tadinya di `static/images/` sekarang pindah ke `public/images/`.

### 3. Jalankan
```bash
npm run dev
```

Buka browser di `http://localhost:5173`

---

## Struktur Project
```
src/
├── main.jsx              ← Entry point
├── App.jsx               ← Routing semua halaman
├── index.css             ← reset.css + main.css
├── components/
│   ├── Layout.jsx        ← Wrapper (sidebar + header)
│   ├── Layout.css        ← header.css
│   ├── Sidebar.jsx       ← sidebar.html → React component
│   └── Sidebar.css       ← sidebar.css
└── pages/
    ├── Home.jsx          ← Halaman home
    ├── Home.css
    ├── WorkOrder.jsx     ← Placeholder (isi sesuai kebutuhan)
    ├── WorkOrder.css
    ├── Assets.jsx        ← Placeholder
    ├── Assets.css
    ├── Locations.jsx     ← Placeholder
    └── Locations.css
```
