"use client";

import { useState, useEffect, useMemo, useRef } from "react";

interface Item {
  id: string;
  name: string;
  stock: number; 
  min: number;   
  price: number; 
}

interface LogEntry {
  id: string;
  timestamp: string;
  action: string;
  itemName: string;
  details: string;
  type: "in" | "out" | "system" | "edit";
}

type Toast = { id: number; msg: string; ok: boolean };

const SEED: Omit<Item, "id">[] = [
  { name: "Biled es",              stock: 20, min: 15, price: 50000 },
  { name: "Biled albredt",         stock: 15, min: 15, price: 75000 },
  { name: "Rgb 5 vol",             stock: 30, min: 15, price: 15000 },
  { name: "Shround",               stock: 12, min: 15, price: 25000 },
  { name: "Stepdown 8A",           stock: 8,  min: 15, price: 12000 },
  { name: "Modul dmx",             stock: 25, min: 15, price: 35000 },
  { name: "Panel p5",              stock: 6,  min: 15, price: 85000 },
  { name: "Panel p4",              stock: 9,  min: 15, price: 95000 },
  { name: "Controller d16",        stock: 18, min: 15, price: 45000 },
  { name: "Controled wf2",         stock: 11, min: 15, price: 20000 },
  { name: "Rgb gerak",             stock: 22, min: 15, price: 18000 },
  { name: "Led rol pink",          stock: 40, min: 15, price: 30000 },
  { name: "Led rol merah",         stock: 35, min: 15, price: 30000 },
  { name: "Led rol putih",         stock: 28, min: 15, price: 30000 },
  { name: "Led rol warm white",    stock: 19, min: 15, price: 30000 },
  { name: "Led rol blue ice",      stock: 14, min: 15, price: 35000 },
  { name: "Led rol biru",          stock: 33, min: 15, price: 30000 },
  { name: "Biled 1.5 inch",        stock: 50, min: 15, price: 120000 },
  { name: "Lampu tembak 3 mata",   stock: 7,  min: 15, price: 40000 },
  { name: "Rotator pink",          stock: 4,  min: 15, price: 65000 },
  { name: "Rotator blue ice",      stock: 5,  min: 15, price: 65000 },
  { name: "Led cob 9 mata blue ice", stock: 16, min: 15, price: 15000 },
  { name: "Led cob 9 mata pink",   stock: 13, min: 15, price: 15000 },
  { name: "Led cob 9 mata biru",   stock: 10, min: 15, price: 15000 },
  { name: "Led cob 9 mata hijau",  stock: 8,  min: 15, price: 15000 },
  { name: "Stepdown 5A",           stock: 17, min: 15, price: 10000 },
];

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

const getFormattedDate = () => {
  const d = new Date();
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  };
  return d.toLocaleDateString('id-ID', options).replace(' pukul', ' ·');
};

function stockHealth(stock: number, min: number): "ok" | "low" | "critical" {
  if (stock <= 0) return "critical";
  if (stock <= min) return "low";
  return "ok";
}

const HEALTH_COLOR: Record<string, string> = {
  ok:       "#8B5CF6",
  low:      "#F59E0B",
  critical: "#EF4444",
};

const HEALTH_GLOW: Record<string, string> = {
  ok:       "rgba(139,92,246,0.35)",
  low:      "rgba(245,158,11,0.35)",
  critical: "rgba(239,68,68,0.35)",
};

const LOG_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  in:       { bg: "rgba(34,197,94,0.1)",  text: "#22C55E", label: "STOK MASUK" },
  out:      { bg: "rgba(239,68,68,0.1)",  text: "#EF4444", label: "STOK KELUAR" },
  edit:     { bg: "rgba(245,158,11,0.1)", text: "#F59E0B", label: "EDIT INFO" },
  system:   { bg: "rgba(139,92,246,0.1)", text: "#A78BFA", label: "PRODUK BARU" },
};

const formatRupiah = (num: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
};

export default function StockPage() {
  const [items, setItems]   = useState<Item[]>([]);
  const [logs, setLogs]     = useState<LogEntry[]>([]);
  const [ready, setReady]     = useState(false);
  const [toasts, setToasts]   = useState<Toast[]>([]);
  
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newStock, setNewStock] = useState("5"); 
  const [newMin, setNewMin]   = useState("15"); 
  const [newPrice, setNewPrice] = useState("0");

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [editName, setEditName] = useState("");
  const [editMin, setEditMin] = useState("15");
  const [editPrice, setEditPrice] = useState("0");

  const [selectedChartItem, setSelectedChartItem] = useState<Item | null>(null);

  const [search, setSearch]   = useState("");
  const [chartView, setChartView] = useState<"all" | "low">("all");
  const toastCounter = useRef(0);

  useEffect(() => {
    try {
      const savedItems = localStorage.getItem("inv-items-v5");
      const savedLogs  = localStorage.getItem("inv-logs-v5");
      
      if (savedItems) setItems(JSON.parse(savedItems));
      else setItems(SEED.map(s => ({ ...s, id: uid() })));

      if (savedLogs) setLogs(JSON.parse(savedLogs));
      else setLogs([]);
    } catch {
      setItems(SEED.map(s => ({ ...s, id: uid() })));
      setLogs([]);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) {
      localStorage.setItem("inv-items-v5", JSON.stringify(items));
      localStorage.setItem("inv-logs-v5", JSON.stringify(logs));
    }
  }, [items, logs, ready]);

  function addLog(type: LogEntry["type"], itemName: string, action: string, details: string) {
    const newEntry: LogEntry = {
      id: uid(),
      timestamp: getFormattedDate(),
      type,
      itemName,
      action,
      details
    };
    setLogs(prev => [newEntry, ...prev].slice(0, 100)); // Batasi maksimal 100 riwayat terbaru
  }

  function toast(msg: string, ok = true) {
    const id = ++toastCounter.current;
    setToasts(t => [...t, { id, msg, ok }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2800);
  }

  function increment(id: string) {
    setItems(prev => prev.map(it => {
      if (it.id === id) {
        addLog("in", it.name, "Tambah 1 Pcs", `Stok berubah dari ${it.stock} ➔ ${it.stock + 1}`);
        return { ...it, stock: it.stock + 1 };
      }
      return it;
    }));
  }

  function decrement(id: string) {
    setItems(prev => prev.map(it => {
      if (it.id !== id) return it;
      if (it.stock <= 0) { toast(`Stok ${it.name} sudah 0`, false); return it; }
      addLog("out", it.name, "Kurang 1 Pcs", `Stok berubah dari ${it.stock} ➔ ${it.stock - 1}`);
      return { ...it, stock: it.stock - 1 };
    }));
  }

  function editStock(id: string, val: string) {
    const n = parseInt(val);
    if (isNaN(n) || n < 0) return;
    setItems(prev => prev.map(it => {
      if (it.id === id) {
        if (it.stock === n) return it;
        const type = n > it.stock ? "in" : "out";
        const label = n > it.stock ? "Koreksi Stok (Bertambah)" : "Koreksi Stok (Berkurang)";
        addLog(type, it.name, label, `Input manual merubah stok dari ${it.stock} ➔ ${n}`);
        return { ...it, stock: n };
      }
      return it;
    }));
  }

  function removeItem(id: string, name: string) {
    if (!confirm(`Hapus "${name}" dari stok?`)) return;
    setItems(prev => prev.filter(it => it.id !== id));
    addLog("out", name, "Hapus Produk", "Barang dihapus permanen dari sistem dashboard");
    toast(`"${name}" dihapus`);
  }

  function openEditModal(item: Item) {
    setEditingItem(item);
    setEditName(item.name);
    setEditMin(item.min.toString());
    setEditPrice((item.price / 1000).toString());
    setShowEditModal(true);
  }

  function saveEditItem() {
    if (!editingItem) return;
    const nm = editName.trim();
    if (!nm) { toast("Nama barang wajib diisi", false); return; }
    const mn = parseInt(editMin);
    const prc = parseInt(editPrice) * 1000;

    const validMin = isNaN(mn) || mn < 0 ? 15 : mn;
    const validPrice = isNaN(prc) || prc < 0 ? 0 : prc;

    setItems(prev => prev.map(it => {
      if (it.id === editingItem.id) {
        let perubahan: string[] = [];
        if (it.name !== nm) perubahan.push(`Nama diganti`);
        if (it.price !== validPrice) perubahan.push(`Harga: ${formatRupiah(it.price)} ➔ ${formatRupiah(validPrice)}`);
        if (it.min !== validMin) perubahan.push(`Batas Min: ${it.min} ➔ ${validMin}`);
        
        if (perubahan.length > 0) {
          addLog("edit", nm, "Update Spesifikasi", perubahan.join(" | "));
        }
        return { ...it, name: nm, min: validMin, price: validPrice };
      }
      return it;
    }));

    toast(`"${nm}" berhasil diperbarui`);
    setShowEditModal(false);
    setEditingItem(null);
  }

  function addItem() {
    const nm = newName.trim();
    if (!nm) { toast("Nama barang wajib diisi", false); return; }
    const stk = parseInt(newStock);
    const mn  = parseInt(newMin);
    const prc = parseInt(newPrice) * 1000;
    if (isNaN(stk) || stk < 0) { toast("Stok harus ≥ 0", false); return; }
    
    const newItem: Item = { 
      id: uid(), 
      name: nm, 
      stock: stk, 
      min: isNaN(mn) ? 15 : mn,
      price: isNaN(prc) || prc < 0 ? 0 : prc
    };
    setItems(prev => [...prev, newItem]);
    addLog("system", nm, "Registrasi Produk Baru", `Stok awal: ${stk} Pcs | Harga: ${formatRupiah(newItem.price)}`);
    toast(`"${nm}" ditambahkan`);
    setShowModal(false);
    setNewName(""); setNewStock("5"); setNewMin("15"); setNewPrice("0");
  }

  function clearLogs() {
    if (!confirm("Apakah Anda yakin ingin menghapus semua riwayat aktivitas log ini?")) return;
    setLogs([]);
    toast("Semua riwayat aktivitas dibersihkan");
  }

  const filtered = useMemo(() =>
    items.filter(it => it.name.toLowerCase().includes(search.toLowerCase())),
    [items, search]
  );

  const chartItems = useMemo(() => {
    const src = chartView === "low"
      ? items.filter(it => stockHealth(it.stock, it.min) !== "ok")
      : items;
    return [...src].sort((a, b) => b.stock - a.stock);
  }, [items, chartView]);

  const maxStock   = Math.max(...chartItems.map(i => i.stock), 1);
  const totalTypes = items.length;
  const totalStock = items.reduce((s, i) => s + i.stock, 0);
  const lowCount   = items.filter(i => stockHealth(i.stock, i.min) !== "ok").length;
  const totalValue = items.reduce((s, i) => s + (i.stock * i.price), 0);

  if (!ready) {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
        height:"100vh", background:"#0a0a12", flexDirection:"column", gap:16 }}>
        <div style={{ width:36, height:36, border:"3px solid #2D1F5E",
          borderTopColor:"#8B5CF6", borderRadius:"50%", animation:"spin 0.7s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <span style={{ color:"#7C3AED", fontFamily:"Inter,sans-serif", fontSize:14 }}>Memuat...</span>
      </div>
    );
  }

  return (
    <div style={S.root}>
      {/* ── Global CSS ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin:0; padding:0; }
        html { scroll-behavior: smooth; }
        body { background:#0a0a12; overflow-x:hidden; }

        ::-webkit-scrollbar { width:6px; height:6px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#3B1F8C; border-radius:99px; }

        @keyframes spin    { to { transform:rotate(360deg) } }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn { from{opacity:0;transform:translateX(60px)} to{opacity:1;transform:translateX(0)} }
        @keyframes pulse2  { 0%,100%{opacity:1} 50%{opacity:.55} }

        .card  { animation: fadeUp .4s ease both; }
        .row   { transition: background .15s; }
        .row:hover { background: rgba(139,92,246,.07) !important; }

        .bar-fill { transition: width .5s cubic-bezier(.4,0,.2,1); }
        .bar-container { cursor: pointer; transition: transform 0.2s; }
        .bar-container:hover { transform: scaleX(1.002); }

        .btn-qty { transition: background .15s, transform .1s; -webkit-tap-highlight-color: transparent; }
        .btn-qty:active { transform: scale(.85); }

        .modal-overlay {
          position:fixed; inset:0; z-index:200;
          background:rgba(0,0,0,.75);
          backdrop-filter: blur(8px);
          display:flex; align-items:center; justify-content:center; padding:16px;
          animation: fadeUp .2s ease;
        }
        .modal-box {
          background:#13132a;
          border:1px solid rgba(139,92,246,.3);
          border-radius:20px;
          padding:24px;
          width:100%; max-width:440px;
          box-shadow: 0 0 60px rgba(139,92,246,.15);
          max-height: 90vh;
          overflow-y: auto;
        }

        .inp:focus { outline:none; border-color:#7C3AED !important;
          box-shadow:0 0 0 3px rgba(124,58,237,.18); }
        .inp::placeholder { color:#3d3d6b; }

        .toast-item { animation: slideIn .3s ease; }
        .chip-active { background:#7C3AED !important; color:#fff !important; }
        .chip { transition: background .2s, color .2s; }

        .stock-inp:focus { outline:none; border-color:#7C3AED !important; }
        .stock-inp { text-align:center; }
        .badge-critical { animation: pulse2 1.8s infinite; }

        /* Responsif Sempurna di HP */
        @media (max-width:768px) {
          .hide-md { display:none !important; }
          .chart-label { font-size:11px !important; max-width:90px !important; width:90px !important; }
          .row { padding: 14px 12px !important; gap: 8px !important; }
          .logo-img { height: 42px !important; }
          .logo-text { font-size: 14px !important; letter-spacing: 0.05em !important; }
          .brand-container { gap: 6px !important; }
          .log-meta-box { flex-direction: column !important; align-items: flex-start !important; gap: 4px !important; }
        }
        @media (max-width:640px) {
          .hide-sm { display:none !important; }
          .table-scrollable { overflow-x: auto; WebkitOverflowScrolling: touch; }
          .search-input-box { width: 100px !important; }
        }
      `}</style>

      {/* ════════════════════════════════════
          HEADER (RESPONSIF HP)
      ════════════════════════════════════ */}
      <header style={S.header}>
        <div style={S.headerInner}>
          <div className="brand-container" style={S.brandContainer}>
            <div style={S.logoWrap}>
              <img 
                className="logo-img"
                src="/logo-removebg.png" 
                alt="Lingga Autolamp Logo" 
                style={{ height: "60px", width: "auto", objectFit: "contain" }} 
              />
            </div>
            <div style={S.textWrap}>
              <span className="logo-text" style={S.logoTextPrimary}>LINGGA</span>
              <span className="logo-text" style={S.logoTextSecondary}>AUTOLAMP</span>
            </div>
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={S.searchWrap}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink:0, color:"#5B5B8A" }}>
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
                <path d="m16.5 16.5 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <input
                className="inp search-input-box"
                style={S.searchInp}
                placeholder="Cari barang..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button style={S.btnAdd} onClick={() => setShowModal(true)}>
              <span style={{ fontSize:20, lineHeight:1, fontWeight:"bold" }}>+</span>
              <span className="hide-sm">Tambah</span>
            </button>
          </div>
        </div>
      </header>

      {/* ════════════════════════════════════
          KONTEN UTAMA
      ════════════════════════════════════ */}
      <main style={S.main}>

        {/* Ringkasan Statistik */}
        <div style={S.statsRow}>
          <StatCard
            label="Jenis Barang"
            value={totalTypes.toLocaleString("id-ID")}
            sub="item terdaftar"
            accent="#8B5CF6"
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 10h16M4 14h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>}
            delay={0}
          />
          <StatCard
            label="Total Stok"
            value={totalStock.toLocaleString("id-ID")}
            sub="unit tersedia"
            accent="#A78BFA"
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 7V5a2 2 0 0 0-4 0v2M8 7V5a2 2 0 0 0-4 0v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>}
            delay={60}
          />
          <StatCard
            label="Stok di Bawah Batas"
            value={lowCount.toLocaleString("id-ID")}
            sub="perlu order lagi"
            accent={lowCount > 0 ? "#F59E0B" : "#22C55E"}
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>}
            delay={120}
          />
          <StatCard
            label="Nilai Inventory"
            value={formatRupiah(totalValue)}
            sub="total nilai modal"
            accent="#10B981"
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            delay={180}
          />
        </div>

        {/* ── Grafis Batas Stok ── */}
        <section className="card" style={{ ...S.card, animationDelay:"180ms" }}>
          <div style={S.cardHead}>
            <div>
              <div style={S.cardTitle}>Grafik Batas Stok</div>
              <div style={S.cardSub}>
                {chartView === "all" ? `Semua ${items.length} item` : `${lowCount} item stok rendah`} · <span style={{color: "#A78BFA"}}>Klik baris grafis untuk info lengkap</span>
              </div>
            </div>
            <div style={{ display:"flex", gap:6, flexShrink:0 }}>
              {(["all","low"] as const).map(v => (
                <button
                  key={v}
                  className={`chip ${chartView === v ? "chip-active" : ""}`}
                  style={S.chip(chartView === v)}
                  onClick={() => setChartView(v)}
                >
                  {v === "all" ? "Tampilkan Semua" : "⚠ Stok Rendah"}
                </button>
              ))}
            </div>
          </div>

          {chartItems.length === 0 ? (
            <div style={{ textAlign:"center", padding:"40px 0", color:"#4A4A7A", fontSize:13 }}>
              {chartView === "low" ? "Semua stok dalam keadaan aman! 🎉" : "Belum ada data barang"}
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:10, paddingTop:4 }}>
              {chartItems.map((it, idx) => {
                const pct   = maxStock > 0 ? (it.stock / maxStock) * 100 : 0;
                const h     = stockHealth(it.stock, it.min);
                const color = HEALTH_COLOR[h];
                const glow  = HEALTH_GLOW[h];
                return (
                  <div key={it.id} className="bar-container" onClick={() => setSelectedChartItem(it)} style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <div className="chart-label" title={it.name} style={{ width:150, minWidth:100, flexShrink:0, fontSize:13, color:"#A78BFA", fontWeight: 500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", textAlign:"right" }}>
                      {it.name}
                    </div>
                    <div style={{ flex:1, height:26, background:"rgba(255,255,255,.03)", borderRadius:6, overflow:"hidden", position:"relative" }}>
                      <div className="bar-fill" style={{ height:"100%", width:`${Math.max(pct, it.stock > 0 ? 1 : 0)}%`, background:`linear-gradient(90deg, ${color}CC, ${color})`, borderRadius:6, boxShadow:`0 0 10px ${glow}` }} />
                      {maxStock > 0 && (
                        <div style={{ position:"absolute", top:0, bottom:0, left:`${(it.min / maxStock) * 100}%`, width:2, background:"#fff", opacity: 0.4 }} />
                      )}
                    </div>
                    <div style={{ width:40, textAlign:"right", flexShrink:0, fontSize:14, fontWeight:700, color: color, fontVariantNumeric:"tabular-nums" }}>
                      {it.stock}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Tabel Utama Manajemen Stok ── */}
        <section className="card" style={{ ...S.card, padding:0, overflow:"hidden", animationDelay:"240ms" }}>
          <div style={{ ...S.cardHead, padding:"24px 24px 16px" }}>
            <div>
              <div style={S.cardTitle}>Manajemen Stok & Harga Produk</div>
              <div style={S.cardSub}>Menampilkan {filtered.length} produk aktif di toko Anda</div>
            </div>
          </div>

          <div className="table-scrollable">
            <div style={{ minWidth: 700 }}>
              <div style={S.tableHeader}>
                <span style={S.colName}>Nama Barang / Aksesoris</span>
                <span style={S.colPrice}>Harga Barang</span>
                <span style={S.colQtyContainer}>Ubah Stok</span>
                <span style={S.colMin}>Min Stok</span>
                <span style={S.colStatus}>Kondisi</span>
                <span style={S.colActions}>Aksi</span>
              </div>

              <div style={{ maxHeight:450, overflowY:"auto" }}>
                {filtered.length === 0 ? (
                  <div style={{ textAlign:"center", padding:"50px 20px", color:"#4A4A7A", fontSize:14 }}>Data tidak ditemukan.</div>
                ) : (
                  filtered.map((it, idx) => {
                    const h = stockHealth(it.stock, it.min);
                    return (
                      <div key={it.id} className="row" style={{ ...S.tableRow, borderLeft:`4px solid ${HEALTH_COLOR[h]}`, animationDelay:`${idx * 12}ms` }}>
                        <div style={S.colName}>
                          <div style={{ width:8, height:8, borderRadius:"50%", background:HEALTH_COLOR[h], flexShrink:0, boxShadow:`0 0 8px ${HEALTH_GLOW[h]}` }} />
                          <span style={{ fontSize:14, color:"#E9E3FF", fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{it.name}</span>
                        </div>
                        <div style={S.colPrice}>{formatRupiah(it.price)}</div>
                        <div style={S.colQtyContainer}>
                          <button className="btn-qty" onClick={() => decrement(it.id)} style={S.btnQty("#EF4444","rgba(239,68,68,.15)")}>−</button>
                          <input className="stock-inp inp" type="number" min={0} value={it.stock} onChange={e => editStock(it.id, e.target.value)} style={S.stockInp} />
                          <button className="btn-qty" onClick={() => increment(it.id)} style={S.btnQty("#22C55E","rgba(34,197,94,.15)")}>+</button>
                        </div>
                        <div style={S.colMin}>{it.min}</div>
                        <div style={S.colStatus}>
                          <span className={h === "critical" ? "badge-critical" : undefined} style={S.badge(h)}>
                            {h === "ok" ? "✓ Aman" : h === "low" ? "⚠ Rendah" : "✕ Kritis"}
                          </span>
                        </div>
                        <div style={S.colActions}>
                          <button onClick={() => openEditModal(it)} style={S.btnEdit}><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                          <button onClick={() => removeItem(it.id, it.name)} style={S.btnDel}><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════
            KARTU RIWAYAT LOG AKTIVITAS (YANG KEMARIN KETINGGALAN)
        ════════════════════════════════════ */}
        <section className="card" style={{ ...S.card, animationDelay:"300ms", padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={S.cardTitle}>Riwayat Aktivitas Log Toko</div>
              <div style={S.cardSub}>Mencatat 100 aktivitas perubahan stok dan produk secara real-time</div>
            </div>
            {logs.length > 0 && (
              <button onClick={clearLogs} style={S.btnResetLog}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 4}}><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                Bersihkan Log
              </button>
            )}
          </div>

          <div style={{ maxHeight: 380, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, paddingRight: 4 }}>
            {logs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#4A4A7A", fontSize: 13, border: "1px dashed rgba(139,92,246,0.15)", borderRadius: 12 }}>
                Belum ada aktivitas log yang tercatat. Coba ubah stok barang di atas!
              </div>
            ) : (
              logs.map((log) => {
                const sty = LOG_STYLES[log.type] || LOG_STYLES.edit;
                return (
                  <div key={log.id} style={S.logRow}>
                    <div className="log-meta-box" style={{ display: "flex", alignItems: "center", justifyItems: "flex-start", gap: 12, flexShrink: 0 }}>
                      <span style={S.logBadge(sty.bg, sty.text)}>{sty.label}</span>
                      <span style={{ fontSize: 11, color: "#4A4A7A", whiteSpace: "nowrap" }}>{log.timestamp}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0, fontSize: 13 }}>
                      <span style={{ color: "#A78BFA", fontWeight: 600, marginRight: 6 }}>{log.itemName}</span>
                      <span style={{ color: "#E9E3FF", opacity: 0.85 }}>{log.action}</span>
                      {log.details && (
                        <div style={{ fontSize: 12, color: "#5B5B8A", marginTop: 2, fontStyle: "italic" }}>
                          {log.details}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

      </main>

      <footer style={{ textAlign:"center", padding:"40px 24px", color:"#4A4A7A", fontSize:12 }}>
        © 2026 LINGGA AUTOLAMP · Sistem Dashboard Manajemen Terintegrasi
      </footer>

      {/* ── MODAL: TAMBAH BARANG ── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
              <div style={{ fontSize:18, fontWeight:700, color:"#FBBF24" }}>Tambah Barang Baru</div>
              <button onClick={() => setShowModal(false)} style={S.btnClose}>✕</button>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <label style={S.formLabel}>Nama Barang / Kode Seri *<input className="inp" style={S.formInput} placeholder="Contoh: Biled 2.5 inch Matrix" value={newName} onChange={e => setNewName(e.target.value)} autoFocus /></label>
              <label style={S.formLabel}>Harga Barang (Ribuan)
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <span style={{ position: "absolute", left: 14, color: "#5B5B8A", fontSize: 14 }}>Rp</span>
                  <input className="inp" style={{ ...S.formInput, width: "100%", paddingLeft: 40, paddingRight: 60 }} type="number" min={0} value={newPrice} onChange={e => setNewPrice(e.target.value)} />
                  <span style={{ position: "absolute", right: 14, color: "#5B5B8A", fontSize: 13, fontWeight: "bold" }}>.000</span>
                </div>
              </label>
              <label style={S.formLabel}>Stok Awal Toko<input className="inp" style={S.formInput} type="number" min={0} value={newStock} onChange={e => setNewStock(e.target.value)} /></label>
              <label style={S.formLabel}>Batas Minimum Stok Aman Peringatan<input className="inp" style={S.formInput} type="number" min={0} value={newMin} onChange={e => setNewMin(e.target.value)} /></label>
            </div>
            <div style={{ display:"flex", gap:12, justifyContent:"flex-end", marginTop:28 }}>
              <button onClick={() => setShowModal(false)} style={S.btnCancel}>Batal</button>
              <button onClick={addItem} style={S.btnSave}>Simpan Produk</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: EDIT BARANG ── */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => { setShowEditModal(false); setEditingItem(null); }}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
              <div style={{ fontSize:18, fontWeight:700, color:"#E9E3FF" }}>Edit Spesifikasi Barang</div>
              <button onClick={() => { setShowEditModal(false); setEditingItem(null); }} style={S.btnClose}>✕</button>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <label style={S.formLabel}>Nama Produk Lampu<input className="inp" style={S.formInput} value={editName} onChange={e => setEditName(e.target.value)} /></label>
              <label style={S.formLabel}>Harga Baru (Ribuan)
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <span style={{ position: "absolute", left: 14, color: "#5B5B8A", fontSize: 14 }}>Rp</span>
                  <input className="inp" style={{ ...S.formInput, width: "100%", paddingLeft: 40, paddingRight: 60 }} type="number" min={0} value={editPrice} onChange={e => setEditPrice(e.target.value)} />
                  <span style={{ position: "absolute", right: 14, color: "#5B5B8A", fontSize: 13, fontWeight: "bold" }}>.000</span>
                </div>
              </label>
              <label style={S.formLabel}>Batas Minimum Stok<input className="inp" style={S.formInput} type="number" min={0} value={editMin} onChange={e => setEditMin(e.target.value)} /></label>
            </div>
            <div style={{ display:"flex", gap:12, justifyContent:"flex-end", marginTop:28 }}>
              <button onClick={() => { setShowEditModal(false); setEditingItem(null); }} style={S.btnCancel}>Batal</button>
              <button onClick={saveEditItem} style={S.btnSave}>Simpan Perubahan</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: DETAIL BARANG (GRAFIK) ── */}
      {selectedChartItem && (
        <div className="modal-overlay" onClick={() => setSelectedChartItem(null)}>
          <div className="modal-box" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <div style={{ fontSize:16, fontWeight:700, color:"#FBBF24" }}>Detail Produk Lampu</div>
              <button onClick={() => setSelectedChartItem(null)} style={S.btnClose}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: "#5B5B8A", textTransform: "uppercase", fontWeight:600 }}>Nama Item</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#E9E3FF", marginTop: 2 }}>{selectedChartItem.name}</div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: "#5B5B8A", textTransform: "uppercase", fontWeight:600 }}>Harga Satuan</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#10B981", marginTop: 2 }}>{formatRupiah(selectedChartItem.price)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#5B5B8A", textTransform: "uppercase", textAlign: "right", fontWeight:600 }}>Total Modal Stok</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#8B5CF6", textAlign: "right", marginTop: 2 }}>{formatRupiah(selectedChartItem.stock * selectedChartItem.price)}</div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", background: "rgba(139,92,246,0.06)", padding: "12px", borderRadius: "12px", border: "1px solid rgba(139,92,246,0.15)", marginTop: 4 }}>
                <div>
                  <div style={{ fontSize: 12, color: "#8B8BAD" }}>Stok Saat Ini</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginTop: 2 }}>{selectedChartItem.stock} Pcs</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#8B8BAD", textAlign: "center" }}>Target Minimum</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#F59E0B", textAlign: "center", marginTop: 2 }}>{selectedChartItem.min}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#8B8BAD", textAlign: "right" }}>Status</div>
                  <div style={{ textAlign: "right", marginTop: 4 }}>
                    <span style={S.badge(stockHealth(selectedChartItem.stock, selectedChartItem.min))}>
                      {stockHealth(selectedChartItem.stock, selectedChartItem.min) === "ok" ? "Aman" : stockHealth(selectedChartItem.stock, selectedChartItem.min) === "low" ? "Rendah" : "Kritis"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST POPUP ── */}
      <div style={{ position:"fixed", bottom:24, right:24, zIndex:300, display:"flex", flexDirection:"column", gap:8, alignItems:"flex-end" }}>
        {toasts.map(t => (
          <div key={t.id} className="toast-item" style={{
            background: t.ok ? "rgba(139,92,246,.2)" : "rgba(239,68,68,.2)",
            border:`1px solid ${t.ok ? "rgba(139,92,246,.5)" : "rgba(239,68,68,.5)"}`,
            color: t.ok ? "#E9E3FF" : "#FCA5A5",
            padding:"12px 20px", borderRadius:12, fontSize:14, fontFamily:"Inter,sans-serif", backdropFilter:"blur(12px)", maxWidth:300, boxShadow:"0 6px 24px rgba(0,0,0,.4)",
          }}>{t.msg}</div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// DATA STYLE OBJECT (CSS IN JS)
// ─────────────────────────────────────────────
const S = {
  root: { minHeight:"100vh", background:"#0a0a12", fontFamily:"'Inter', -apple-system, sans-serif", color:"#E9E3FF" } as React.CSSProperties,
  header: { position:"sticky" as const, top:0, zIndex:100, background:"rgba(13,13,26,.96)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(139,92,246,.2)" },
  headerInner: { maxWidth: "1100px", margin:"0 auto", padding:"12px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 } as React.CSSProperties,
  brandContainer: { display: "flex", alignItems: "center", gap: "10px" } as React.CSSProperties,
  logoWrap: { display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: "transparent" } as React.CSSProperties,
  textWrap: { display: "flex", flexDirection: "column" as const, justifyContent: "center", lineHeight: 1.1 } as React.CSSProperties,
  logoTextPrimary: { fontFamily: "'Outfit', sans-serif", fontSize: "20px", fontWeight: 900, color: "#FFFFFF", letterSpacing: "0.08em", textShadow: "0 0 12px rgba(255,255,255,0.2)" } as React.CSSProperties,
  logoTextSecondary: { fontFamily: "'Outfit', sans-serif", fontSize: "20px", fontWeight: 900, color: "#FBBF24", letterSpacing: "0.08em", textShadow: "0 0 15px rgba(251,191,36,0.4)" } as React.CSSProperties,
  searchWrap: { display:"flex", alignItems:"center", gap:8, background:"rgba(139,92,246,.06)", border:"1px solid rgba(139,92,246,.15)", borderRadius:10, padding:"8px 14px" } as React.CSSProperties,
  searchInp: { background:"transparent", border:"none", outline:"none", color:"#fff", fontSize:13, width:150, fontFamily:"Inter,sans-serif" } as React.CSSProperties,
  btnAdd: { display:"flex", alignItems:"center", gap:6, padding:"10px 18px", background:"linear-gradient(135deg,#7C3AED,#6025C0)", color:"#fff", border:"none", borderRadius:10, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"Inter,sans-serif", boxShadow:"0 4px 14px rgba(124,58,237,.3)", flexShrink:0, whiteSpace:"nowrap" as const } as React.CSSProperties,
  main: { maxWidth: "1100px", margin:"0 auto", padding:"24px 24px 16px", display:"flex", flexDirection:"column" as const, gap:24 },
  statsRow: { display:"flex", gap:14, flexWrap:"wrap" as const },
  card: { background:"#13132a", border:"1px solid rgba(139,92,246,.15)", borderRadius:18, padding:"22px" } as React.CSSProperties,
  cardHead: { display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12, marginBottom:20, flexWrap:"wrap" as const },
  cardTitle: { fontSize:16, fontWeight:700, color:"#E9E3FF", letterSpacing:"-0.01em" },
  cardSub: { fontSize:12, color:"#5B5B8A", marginTop:4 },
  chip: (active: boolean): React.CSSProperties => ({ padding:"6px 14px", borderRadius:20, fontSize:12, fontWeight:500, cursor:"pointer", border:"1px solid rgba(139,92,246,.2)", background: active ? "#7C3AED" : "transparent", color: active ? "#fff" : "#8B8BAD", fontFamily:"Inter,sans-serif" }),
  colName: { flex: "2 1 200px", display: "flex", alignItems: "center", gap: 10, minWidth: 0 },
  colPrice: { width: 140, textAlign: "left", fontSize: 14, color: "#10B981", fontWeight: 600, flexShrink: 0 },
  colQtyContainer: { width: 130, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, flexShrink: 0 },
  colMin: { width: 70, textAlign: "center", fontSize: 13, color: "#8B8BAD", flexShrink: 0 },
  colStatus: { width: 90, display: "flex", justifyContent: "center", flexShrink: 0 },
  colActions: { width: 90, display: "flex", justifyContent: "center", gap: 8, flexShrink: 0 },
  tableHeader: { display:"flex", alignItems:"center", padding:"12px 24px", borderBottom:"1px solid rgba(139,92,246,.15)", fontSize:11, color:"#5B5B8A", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:"0.07em", gap:8, background: "rgba(19,19,42,0.5)" },
  tableRow: { display:"flex", alignItems:"center", padding:"14px 24px", gap:8, borderBottom:"1px solid rgba(139,92,246,.08)" } as React.CSSProperties,
  btnQty: (color: string, bg: string): React.CSSProperties => ({ width:38, height:38, borderRadius:10, flexShrink:0, background:bg, color:color, border:`1px solid ${color}35`, fontSize:20, fontWeight:"bold", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"Inter,sans-serif" }),
  stockInp: { width:42, height:38, borderRadius:10, background:"rgba(139,92,246,.06)", border:"1px solid rgba(139,92,246,.25)", color:"#fff", fontSize:14, fontWeight:700, fontFamily:"Inter,sans-serif", textAlign:"center" as const, fontVariantNumeric:"tabular-nums" as const } as React.CSSProperties,
  badge: (h: "ok"|"low"|"critical"): React.CSSProperties => ({ padding:"4px 10px", borderRadius:20, fontSize:11, fontWeight:600, background: h === "ok" ? "rgba(139,92,246,.15)" : h === "low" ? "rgba(245,158,11,.15)" : "rgba(239,68,68,.15)", color: h === "ok" ? "#A78BFA" : h === "low" ? "#FBBF24" : "#FCA5A5", whiteSpace:"nowrap" as const }),
  btnEdit: { width:32, height:32, borderRadius:8, flexShrink:0, background:"rgba(139,92,246,.1)", color:"#A78BFA", border:"1px solid rgba(139,92,246,.2)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" } as React.CSSProperties,
  btnDel: { width:32, height:32, borderRadius:8, flexShrink:0, background:"rgba(239,68,68,.1)", color:"#EF4444", border:"1px solid rgba(239,68,68,.2)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" } as React.CSSProperties,
  btnClose: { width:32, height:32, borderRadius:8, background:"rgba(139,92,246,.1)", color:"#8B8BAD", border:"none", cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" } as React.CSSProperties,
  formLabel: { display:"flex", flexDirection:"column" as const, gap:6, fontSize:13, color:"#8B8BAD", fontWeight:600 } as React.CSSProperties,
  formInput: { background:"#0a0a12", border:"1px solid rgba(139,92,246,.25)", borderRadius:10, padding:"12px 14px", color:"#fff", fontSize:14, fontFamily:"Inter,sans-serif", marginTop:4 },
  btnCancel: { padding:"11px 20px", borderRadius:10, cursor:"pointer", background:"rgba(139,92,246,.08)", color:"#8B8BAD", border:"1px solid rgba(139,92,246,.2)", fontSize:14, fontFamily:"Inter,sans-serif" } as React.CSSProperties,
  btnSave: { padding:"11px 22px", borderRadius:10, cursor:"pointer", background:"linear-gradient(135deg,#7C3AED,#6025C0)", color:"#fff", border:"none", fontSize:14, fontWeight:600, fontFamily:"Inter,sans-serif", boxShadow:"0 4px 14px rgba(124,58,237,.3)" } as React.CSSProperties,
  
  // Style khusus Log
  logRow: { display: "flex", flexDirection: "row" as const, alignItems: "flex-start", gap: 16, padding: "12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(139,92,246,0.08)", borderRadius: "12px", animation: "fadeUp 0.3s ease both" },
  logBadge: (bg: string, text: string): React.CSSProperties => ({ padding: "3px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: 700, background: bg, color: text, letterSpacing: "0.03em", display: "inline-block", textAlign: "center", minWidth: "90px" }),
  btnResetLog: { display: "flex", alignItems: "center", padding: "6px 12px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "8px", color: "#FCA5A5", fontSize: "12px", cursor: "pointer", fontFamily: "Inter, sans-serif", transition: "background 0.2s" }
};

function StatCard({ label, value, sub, accent, icon, delay }: { label: string; value: string | number; sub: string; accent: string; icon: React.ReactNode; delay: number; }) {
  return (
    <div className="card" style={{ flex:"1 1 220px", background:"#13132a", border:"1px solid rgba(139,92,246,.15)", borderRadius:16, padding:"20px", display:"flex", alignItems:"center", gap:14, animation:`fadeUp .4s ease both`, animationDelay:`${delay}ms`, minWidth:0 }}>
      <div style={{ width:42, height:42, borderRadius:12, flexShrink:0, background:`${accent}15`, display:"flex", alignItems:"center", justifyContent:"center", color:accent }}>{icon}</div>
      <div style={{ minWidth:0, flex: 1 }}>
        <div style={{ fontSize:11, color:"#5B5B8A", textTransform:"uppercase", letterSpacing:"0.07em", fontWeight:600 }}>{label}</div>
        <div style={{ fontSize:22, fontWeight:700, color:"#fff", letterSpacing:"-0.02em", marginTop:2, fontVariantNumeric:"tabular-nums" }}>{value}</div>
        <div style={{ fontSize:11, color:"#4A4A7A", marginTop:2 }}>{sub}</div>
      </div>
    </div>
  );
}