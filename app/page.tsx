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

  // Load awal dari localStorage
  useEffect(() => {
    try {
      const savedItems = localStorage.getItem("inv-items-v5");
      const savedLogs  = localStorage.getItem("inv-logs-v5");
      
      if (savedItems) setItems(JSON.parse(savedItems));
      if (savedLogs) setLogs(JSON.parse(savedLogs));
    } catch {
      setLogs([]);
    }
    setReady(true);
  }, []);

  // Sinkronisasi otomatis ke localStorage
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
    setLogs(prev => [newEntry, ...prev]);
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
    if (!confirm("Apakah Anda yakin ingin menghapus seluruh riwayat aktivitas log ini?")) return;
    setLogs([]);
    toast("Seluruh riwayat aktivitas dibersihkan");
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
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:"#0a0a12", flexDirection:"column", gap:16 }}>
        <div style={{ width:36, height:36, border:"3px solid #2D1F5E", borderTopColor:"#8B5CF6", borderRadius:"50%", animation:"spin 0.7s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <span style={{ color:"#7C3AED", fontFamily:"Inter,sans-serif", fontSize:14 }}>Memuat dashboard Lingga Autolamp...</span>
      </div>
    );
  }

  return (
    <div style={S.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin:0; padding:0; }
        html, body { height: 100vh; background:#0a0a12; overflow: hidden; }

        ::-webkit-scrollbar { width:6px; height:6px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#3B1F8C; border-radius:99px; }

        @keyframes spin    { to { transform:rotate(360deg) } }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn { from{opacity:0;transform:translateX(60px)} to{opacity:1;transform:translateX(0)} }

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

        .inp:focus { outline:none; border-color:#7C3AED !important; box-shadow:0 0 0 3px rgba(124,58,237,.18); }
        .inp::placeholder { color:#3d3d6b; }

        .toast-item { animation: slideIn .3s ease; }
        .chip-active { background:#7C3AED !important; color:#fff !important; }

        .stock-inp:focus { outline:none; border-color:#7C3AED !important; }

        @media (max-width:768px) {
          .chart-label { font-size:11px !important; max-width:90px !important; width:90px !important; }
          .row { padding: 10px 12px !important; gap: 8px !important; }
        }
        @media (max-width:640px) {
          .hide-sm { display:none !important; }
          .table-scrollable { overflow-x: auto; WebkitOverflowScrolling: touch; }
          .search-input-box { width: 100px !important; }
        }
      `}</style>

      {/* ── HEADER BRAND ── */}
      <header style={S.header}>
        <div style={S.headerInner}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: "18px", letterSpacing: "0.5px" }}>
              <span style={{ color: "#ffffff" }}>LINGGA</span>
              <span style={{ color: "#FBBF24", marginLeft: "6px" }}>AUTOLAMP</span>
            </div>
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={S.searchWrap}>
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
              <span className="hide-sm" style={{ marginLeft: 4 }}>Tambah</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── LAYOUT DASHBOARD 1 SCREEN UTUH ── */}
      <main style={S.main}>

        {/* 1. Baris Kumpulan Statistik */}
        <div style={S.statsRow}>
          <StatCard label="Jenis Barang" value={totalTypes.toLocaleString("id-ID")} sub="item terdaftar" accent="#8B5CF6" />
          <StatCard label="Total Stok" value={totalStock.toLocaleString("id-ID")} sub="unit tersedia" accent="#A78BFA" />
          <StatCard label="Stok Rendah" value={lowCount.toLocaleString("id-ID")} sub="perlu order lagi" accent={lowCount > 0 ? "#F59E0B" : "#22C55E"} />
          <StatCard label="Nilai Inventory" value={formatRupiah(totalValue)} sub="total nilai modal" accent="#10B981" />
        </div>

        {/* 2. Grid Belahan Tengah */}
        <div style={S.gridCenter}>
          
          {/* Sisi Kiri: Tabel Utama Manajemen Stok */}
          <section className="card" style={{ ...S.card, padding:0, overflow:"hidden", display:"flex", flexDirection:"column" }}>
            <div style={{ padding:"16px 20px 10px" }}>
              <div style={S.cardTitle}>Manajemen Stok Utama Toko</div>
            </div>
            <div className="table-scrollable" style={{ flex: 1, overflowY: "auto" }}>
              <div style={{ minWidth: 650 }}>
                <div style={S.tableHeader}>
                  <span style={S.colName}>Nama Barang</span>
                  <span style={S.colPrice}>Harga</span>
                  <span style={S.colQtyContainer}>Ubah Stok</span>
                  <span style={S.colMin}>Min</span>
                  <span style={S.colStatus}>Status</span>
                  <span style={S.colActions}>Aksi</span>
                </div>
                <div>
                  {filtered.map((it) => {
                    const h = stockHealth(it.stock, it.min);
                    return (
                      <div key={it.id} className="row" style={{ ...S.tableRow, borderLeft:`4px solid ${HEALTH_COLOR[h]}` }}>
                        <div style={S.colName}><span style={{ fontSize:13, color:"#E9E3FF", fontWeight:500 }}>{it.name}</span></div>
                        <div style={S.colPrice}>{formatRupiah(it.price)}</div>
                        <div style={S.colQtyContainer}>
                          <button className="btn-qty" onClick={() => decrement(it.id)} style={SF.btnQty("#EF4444","rgba(239,68,68,.15)")}>−</button>
                          <input className="stock-inp inp" type="number" value={it.stock} onChange={e => editStock(it.id, e.target.value)} style={S.stockInp} />
                          <button className="btn-qty" onClick={() => increment(it.id)} style={SF.btnQty("#22C55E","rgba(34,197,94,.15)")}>+</button>
                        </div>
                        <div style={S.colMin}>{it.min}</div>
                        <div style={S.colStatus}><span style={SF.badge(h)}>{h === "ok" ? "✓ Aman" : h === "low" ? "⚠ Rendah" : "✕ Kritis"}</span></div>
                        <div style={S.colActions}>
                          <button onClick={() => openEditModal(it)} style={S.btnEdit}>✏</button>
                          <button onClick={() => removeItem(it.id, it.name)} style={S.btnDel}>🗑</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* Sisi Kanan: Grafik Atas & Riwayat Log Bawah */}
          <div style={S.rightColumn}>
            
            {/* Box Grafik Batas Stok */}
            <section className="card" style={{ ...S.card, flex: 1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
              <div style={{ ...S.cardHead, marginBottom: 12 }}>
                <div>
                  <div style={S.cardTitle}>Grafik Batas Stok</div>
                </div>
                <div style={{ display:"flex", gap:6 }}>
                  {(["all","low"] as const).map(v => (
                    <button
                      key={v}
                      className={`chip ${chartView === v ? "chip-active" : ""}`}
                      style={SF.chip(chartView === v)}
                      onClick={() => setChartView(v)}
                    >
                      {v === "all" ? "Semua" : "⚠ Rendah"}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ flex: 1, overflowY: "auto", display:"flex", flexDirection:"column", gap:8, paddingRight: 4 }}>
                {chartItems.map((it) => {
                  const pct   = maxStock > 0 ? (it.stock / maxStock) * 100 : 0;
                  const h     = stockHealth(it.stock, it.min);
                  return (
                    <div key={it.id} className="bar-container" onClick={() => setSelectedChartItem(it)} style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div className="chart-label" style={{ width:110, minWidth:80, flexShrink:0, fontSize:12, color:"#A78BFA", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", textAlign:"right" }}>{it.name}</div>
                      <div style={{ flex:1, height:20, background:"rgba(255,255,255,.03)", borderRadius:5, overflow:"hidden", position:"relative" }}>
                        <div className="bar-fill" style={{ height:"100%", width:`${pct}%`, background:`linear-gradient(90deg, ${HEALTH_COLOR[h]}CC, ${HEALTH_COLOR[h]})`, borderRadius:5, boxShadow:`0 0 10px ${HEALTH_GLOW[h]}` }} />
                      </div>
                      <div style={{ width:30, textAlign:"right", flexShrink:0, fontSize:12, fontWeight:700, color: HEALTH_COLOR[h] }}>{it.stock}</div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Box Riwayat Aktivitas Log Toko */}
            <section className="card" style={{ ...S.card, flex: 1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={S.cardTitle}>Riwayat Aktivitas Log Toko</div>
                {logs.length > 0 && (
                  <button onClick={clearLogs} style={S.btnResetLog}>Bersihkan</button>
                )}
              </div>
              <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, paddingRight: 4 }}>
                {logs.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "20px 0", color: "#4A4A7A", fontSize: 12 }}>Belum ada log masuk.</div>
                ) : (
                  logs.map((log) => {
                    const sty = LOG_STYLES[log.type] || LOG_STYLES.edit;
                    return (
                      <div key={log.id} style={S.logRow}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: "85px" }}>
                          <span style={SF.logBadge(sty.bg, sty.text)}>{sty.label}</span>
                          <span style={{ fontSize: 9, color: "#4A4A7A" }}>{log.timestamp.split(' · ')[1] || log.timestamp}</span>
                        </div>
                        <div style={{ flex: 1, fontSize: 12, lineHeight: "1.3" }}>
                          <span style={{ color: "#A78BFA", fontWeight: 600 }}>{log.itemName}</span> {log.action}
                          {log.details && <div style={{ fontSize: 11, color: "#5B5B8A", marginTop: 1 }}>{log.details}</div>}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

          </div>
        </div>

        {/* 3. Footer */}
        <footer style={S.footer}>© 2026 LINGGA AUTOLAMP · Dashboard Manajemen Terintegrasi</footer>
      </main>

      {/* ── MODAL TAMBAH BARANG ── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}><div style={{ fontSize:16, fontWeight:700, color:"#FBBF24" }}>Tambah Barang Baru</div><button onClick={() => setShowModal(false)} style={S.btnClose}>✕</button></div>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <label style={S.formLabel}>Nama Barang *<input className="inp" style={S.formInput} placeholder="Contoh: Biled 1.5 inch" value={newName} onChange={e => setNewName(e.target.value)} /></label>
              <label style={S.formLabel}>Harga Jual (Ribuan, Misal: 45 = Rp45.000)<input className="inp" style={S.formInput} type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} /></label>
              <label style={S.formLabel}>Stok Masuk Pertama<input className="inp" style={S.formInput} type="number" value={newStock} onChange={e => setNewStock(e.target.value)} /></label>
              <label style={S.formLabel}>Batas Minimum Peringatan<input className="inp" style={S.formInput} type="number" value={newMin} onChange={e => setNewMin(e.target.value)} /></label>
            </div>
            <div style={{ display:"flex", gap:12, justifyContent:"flex-end", marginTop:24 }}><button onClick={() => setShowModal(false)} style={S.btnCancel}>Batal</button><button onClick={addItem} style={S.btnSave}>Simpan Produk</button></div>
          </div>
        </div>
      )}

      {/* ── MODAL EDIT BARANG ── */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => { setShowEditModal(false); setEditingItem(null); }}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}><div style={{ fontSize:16, fontWeight:700, color:"#E9E3FF" }}>Edit Spesifikasi Barang</div><button onClick={() => { setShowEditModal(false); setEditingItem(null); }} style={S.btnClose}>✕</button></div>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <label style={S.formLabel}>Nama Informasi Produk<input className="inp" style={S.formInput} value={editName} onChange={e => setEditName(e.target.value)} /></label>
              <label style={S.formLabel}>Harga Baru (Ribuan)<input className="inp" style={S.formInput} type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)} /></label>
              <label style={S.formLabel}>Batas Stok Minimum Baru<input className="inp" style={S.formInput} type="number" value={editMin} onChange={e => setEditMin(e.target.value)} /></label>
            </div>
            <div style={{ display:"flex", gap:12, justifyContent:"flex-end", marginTop:24 }}><button onClick={() => { setShowEditModal(false); setEditingItem(null); }} style={S.btnCancel}>Batal</button><button onClick={saveEditItem} style={S.btnSave}>Simpan Perubahan</button></div>
          </div>
        </div>
      )}

      {/* ── MODAL POPUP DETAIL CHART ── */}
      {selectedChartItem && (
        <div className="modal-overlay" onClick={() => setSelectedChartItem(null)}>
          <div className="modal-box" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}><div style={{ fontSize:14, color:"#FBBF24", fontWeight:600 }}>Detail Informasi Stok</div><button onClick={() => setSelectedChartItem(null)} style={S.btnClose}>✕</button></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#E9E3FF" }}>{selectedChartItem.name}</div>
              <div style={{ height:"1px", background:"rgba(139,92,246,0.15)" }}></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "#8B8BAD" }}>Harga Unit:</span>
                <span style={{ color: "#10B981", fontWeight: 600 }}>{formatRupiah(selectedChartItem.price)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "#8B8BAD" }}>Stok Tersedia:</span>
                <span style={{ color: "#fff", fontWeight: 700 }}>{selectedChartItem.stock} Pcs</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "#8B8BAD" }}>Batas Minimum:</span>
                <span style={{ color: "#F59E0B" }}>{selectedChartItem.min} Pcs</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifikasi */}
      <div style={{ position:"fixed", bottom:16, right:16, zIndex:300, display:"flex", flexDirection:"column", gap:6 }}>
        {toasts.map(t => (
          <div key={t.id} style={{ background: t.ok ? "#7C3AED" : "#EF4444", padding:"10px 16px", borderRadius:10, fontSize:13, boxShadow:"0 4px 12px rgba(0,0,0,0.3)" }}>{t.msg}</div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub: string; accent: string; }) {
  return (
    <div className="card" style={{ flex:1, background:"#13132a", border:"1px solid rgba(139,92,246,.15)", borderRadius:12, padding:"12px 16px", display:"flex", alignItems:"center" }}>
      <div>
        <div style={{ fontSize:10, color:"#5B5B8A", textTransform:"uppercase", fontWeight:600 }}>{label}</div>
        <div style={{ fontSize:18, fontWeight:700, color:"#fff", marginTop:1 }}>{value}</div>
        <div style={{ fontSize:10, color:accent, marginTop:1 }}>{sub}</div>
      </div>
    </div>
  );
}

// ── KELOMPOK 1: Objek Properti Style CSS Murni Murni ──
const S: Record<string, React.CSSProperties> = {
  root: { height:"100vh", background:"#0a0a12", fontFamily:"'Inter', sans-serif", color:"#E9E3FF", display:"flex", flexDirection:"column" },
  header: { background:"rgba(13,13,26,.96)", borderBottom:"1px solid rgba(139,92,246,.2)", flexShrink: 0 },
  headerInner: { maxWidth: "1280px", margin:"0 auto", padding:"12px 20px", display:"flex", alignItems:"center", justifyContent:"space-between" },
  searchWrap: { display:"flex", alignItems:"center", background:"rgba(139,92,246,.06)", border:"1px solid rgba(139,92,246,.15)", borderRadius:8, padding:"4px 10px" },
  searchInp: { background:"transparent", border:"none", color:"#fff", width:110, fontSize: 13 },
  btnAdd: { padding:"6px 14px", background:"linear-gradient(135deg,#7C3AED,#6025C0)", color:"#fff", border:"none", borderRadius:8, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", fontSize:13 },
  main: { maxWidth: "1280px", width: "100%", margin:"0 auto", padding:"16px 20px", flex: 1, display:"flex", flexDirection:"column", gap:14, overflow:"hidden" },
  statsRow: { display:"flex", gap:12, flexShrink: 0 },
  gridCenter: { flex: 1, display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 14, overflow: "hidden" },
  rightColumn: { display: "flex", flexDirection: "column", gap: 14, overflow: "hidden" },
  card: { background:"#13132a", border:"1px solid rgba(139,92,246,.15)", borderRadius:14, padding:"16px" },
  cardHead: { display:"flex", justifyContent:"space-between", alignItems: "center" },
  cardTitle: { fontSize:14, fontWeight:700, color:"#E9E3FF" },
  cardSub: { fontSize:11, color:"#5B5B8A", marginTop:2 },
  colName: { flex: "2 1 180px", display: "flex", alignItems: "center" },
  colPrice: { width: 110, color: "#10B981", fontWeight: 600, fontSize: 13 },
  colQtyContainer: { width: 110, display: "flex", alignItems: "center", gap: 4 },
  colMin: { width: 50, textAlign: "center", color: "#8B8BAD", fontSize: 13 },
  colStatus: { width: 80, display: "flex" },
  colActions: { width: 60, display: "flex", gap: 8, justifyContent: "flex-end" },
  tableHeader: { display:"flex", padding:"10px 16px", borderBottom:"1px solid rgba(139,92,246,.15)", fontSize:11, color:"#5B5B8A", fontWeight:700, gap:8, background: "rgba(255,255,255,0.01)" },
  tableRow: { display:"flex", alignItems:"center", padding:"10px 16px", gap:8, borderBottom:"1px solid rgba(139,92,246,.06)" },
  stockInp: { width:36, height:28, borderRadius:8, background:"rgba(139,92,246,.06)", border:"1px solid rgba(139,92,246,.25)", color:"#fff", textAlign:"center", fontWeight:700, fontSize: 13 },
  btnEdit: { background:"transparent", border:"none", color:"#A78BFA", cursor:"pointer", fontSize:14 },
  btnDel: { background:"transparent", border:"none", color:"#EF4444", cursor:"pointer", fontSize:14 },
  btnClose: { background:"transparent", border:"none", color:"#8B8BAD", cursor:"pointer" },
  formLabel: { display:"flex", flexDirection:"column", gap:4, fontSize:12, color:"#8B8BAD" },
  formInput: { background:"#0a0a12", border:"1px solid rgba(139,92,246,.25)", borderRadius:8, padding:"10px", color:"#fff", fontSize:13 },
  btnCancel: { padding:"8px 16px", borderRadius:8, background:"transparent", color:"#8B8BAD", border:"1px solid rgba(139,92,246,.2)", cursor:"pointer", fontSize:13 },
  btnSave: { padding:"8px 18px", borderRadius:8, background:"linear-gradient(135deg,#7C3AED,#6025C0)", color:"#fff", border:"none", fontWeight:600, cursor:"pointer", fontSize:13 },
  logRow: { display: "flex", alignItems: "flex-start", gap: 10, padding: "8px", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(139,92,246,0.06)", borderRadius: "8px" },
  btnResetLog: { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "6px", color: "#FCA5A5", fontSize: "11px", cursor: "pointer", padding: "3px 8px" },
  footer: { textAlign:"center", padding:"4px 0", color:"#4A4A7A", fontSize:11, flexShrink: 0 }
};

// ── KELOMPOK 2: Fungsi Pembuat Style Dinamis (Return React.CSSProperties) ──
const SF = {
  chip: (active: boolean): React.CSSProperties => ({ padding:"4px 10px", borderRadius:6, fontSize:11, cursor:"pointer", background: active ? "#7C3AED" : "transparent", color: active ? "#fff" : "#8B8BAD", border:"1px solid rgba(139,92,246,.2)" }),
  btnQty: (color: string, bg: string): React.CSSProperties => ({ width:28, height:28, borderRadius:8, background:bg, color:color, border:"none", fontSize:16, cursor:"pointer" }),
  badge: (h: "ok"|"low"|"critical"): React.CSSProperties => ({ padding:"3px 8px", borderRadius:6, fontSize:11, fontWeight:600, background: h === "ok" ? "rgba(139,92,246,.12)" : h === "low" ? "rgba(245,158,11,.12)" : "rgba(239,68,68,.12)", color: h === "ok" ? "#A78BFA" : h === "low" ? "#FBBF24" : "#FCA5A5" }),
  logBadge: (bg: string, text: string): React.CSSProperties => ({ padding: "2px 4px", borderRadius: "4px", fontSize: "9px", fontWeight: 700, background: bg, color: text, width: "75px", display:"inline-block", textAlign:"center" })
};