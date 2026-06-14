"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// ── 1. KONFIGURASI JEMBATAN DATABASE ONLINE ──
// Data ini aman menggunakan Public Anon Key bawaan Supabase
const SUPABASE_URL = "https://irbshgwedbbyvqyvshsn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyYnNoZ3dlZGJieXZxeXZzaHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTgzNTI0MDAsImV4cCI6MjAzMzkyODQwMH0.bXN4N1U2M1g5VTVVMTVVMTVVMTVVMTVVMTVVMTVVMTVVMTVV";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

  // ── 2. AMBIL DATA REAL-TIME DARI SERVER CLOUD DUA-DUANYA ──
  useEffect(() => {
    async function loadCloudData() {
      try {
        // Ambil Data Barang
        const { data: cloudItems } = await supabase.from("inventory_items").select("*");
        if (cloudItems && cloudItems.length > 0) {
          setItems(cloudItems);
        } else {
          // Jika cloud kosong, daftarkan data awal
          const initial = [
            { name: "Biled es", stock: 20, min: 15, price: 50000 },
            { name: "Biled albredt", stock: 15, min: 15, price: 75000 },
            { name: "Rgb 5 vol", stock: 30, min: 15, price: 15000 },
            { name: "Shround", stock: 12, min: 15, price: 25000 },
            { name: "Stepdown 8A", stock: 8, min: 15, price: 12000 },
            { name: "Modul dmx", stock: 25, min: 15, price: 35000 },
            { name: "Panel p5", stock: 6, min: 15, price: 85000 },
            { name: "Panel p4", stock: 9, min: 15, price: 95000 },
            { name: "Controller d16", stock: 18, min: 15, price: 45000 },
            { name: "Controled wf2", stock: 11, min: 15, price: 20000 },
            { name: "Rgb gerak", stock: 22, min: 15, price: 18000 },
            { name: "Led rol pink", stock: 40, min: 15, price: 30000 },
            { name: "Led rol merah", stock: 35, min: 15, price: 30000 },
            { name: "Led rol putih", stock: 28, min: 15, price: 30000 },
            { name: "Led rol warm white", stock: 19, min: 15, price: 30000 },
            { name: "Led rol blue ice", stock: 14, min: 15, price: 35000 },
            { name: "Led rol biru", stock: 33, min: 15, price: 30000 },
            { name: "Biled 1.5 inch", stock: 50, min: 15, price: 120000 },
            { name: "Lampu tembak 3 mata", stock: 7, min: 15, price: 40000 },
            { name: "Rotator pink", stock: 4, min: 15, price: 65000 },
            { name: "Rotator blue ice", stock: 5, min: 15, price: 65000 },
            { name: "Led cob 9 mata blue ice", stock: 16, min: 15, price: 15000 },
            { name: "Led cob 9 mata pink", stock: 13, min: 15, price: 15000 },
            { name: "Led cob 9 mata biru", stock: 10, min: 15, price: 15000 },
            { name: "Led cob 9 mata hijau", stock: 8, min: 15, price: 15000 },
            { name: "Stepdown 5A", stock: 17, min: 15, price: 10000 },
          ].map(s => ({ ...s, id: uid() }));
          await supabase.from("inventory_items").insert(initial);
          setItems(initial);
        }

        // Ambil Data Seluruh Log Aktivitas (Diurutkan paling baru)
        const { data: cloudLogs } = await supabase.from("inventory_logs").select("*").order("created_at", { ascending: false });
        if (cloudLogs) setLogs(cloudLogs);

      } catch (e) {
        console.error("Gagal sinkron database cloud:", e);
      }
      setReady(true);
    }

    loadCloudData();

    // ── 3. REALTIME SYNC (Dengar perubahan dari HP/Laptop lain otomatis tanpa refresh) ──
    const itemsChannel = supabase.channel("realtime-items")
      .on("postgres_changes", { event: "*", scheme: "public", table: "inventory_items" }, async () => {
        const { data } = await supabase.from("inventory_items").select("*");
        if (data) setItems(data);
      }).subscribe();

    const logsChannel = supabase.channel("realtime-logs")
      .on("postgres_changes", { event: "*", scheme: "public", table: "inventory_logs" }, async () => {
        const { data } = await supabase.from("inventory_logs").select("*").order("created_at", { ascending: false });
        if (data) setLogs(data);
      }).subscribe();

    return () => {
      supabase.removeChannel(itemsChannel);
      supabase.removeChannel(logsChannel);
    };
  }, []);

  async function addLog(type: LogEntry["type"], itemName: string, action: string, details: string) {
    const newEntry = {
      id: uid(),
      timestamp: getFormattedDate(),
      type,
      itemName,
      action,
      details
    };
    setLogs(prev => [newEntry, ...prev]);
    await supabase.from("inventory_logs").insert([newEntry]);
  }

  function toast(msg: string, ok = true) {
    const id = ++toastCounter.current;
    setToasts(t => [...t, { id, msg, ok }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2800);
  }

  async function increment(id: string) {
    const target = items.find(it => it.id === id);
    if (!target) return;
    const nextStock = target.stock + 1;
    
    setItems(prev => prev.map(it => it.id === id ? { ...it, stock: nextStock } : it));
    addLog("in", target.name, "Tambah 1 Pcs", `Stok berubah dari ${target.stock} ➔ ${nextStock}`);
    await supabase.from("inventory_items").update({ stock: nextStock }).eq("id", id);
  }

  async function decrement(id: string) {
    const target = items.find(it => it.id === id);
    if (!target) return;
    if (target.stock <= 0) { toast(`Stok ${target.name} sudah 0`, false); return; }
    const nextStock = target.stock - 1;

    setItems(prev => prev.map(it => it.id === id ? { ...it, stock: nextStock } : it));
    addLog("out", target.name, "Kurang 1 Pcs", `Stok berubah dari ${target.stock} ➔ ${nextStock}`);
    await supabase.from("inventory_items").update({ stock: nextStock }).eq("id", id);
  }

  async function editStock(id: string, val: string) {
    const n = parseInt(val);
    if (isNaN(n) || n < 0) return;
    const target = items.find(it => it.id === id);
    if (!target || target.stock === n) return;

    const type = n > target.stock ? "in" : "out";
    const label = n > target.stock ? "Koreksi Stok (Bertambah)" : "Koreksi Stok (Berkurang)";
    
    setItems(prev => prev.map(it => it.id === id ? { ...it, stock: n } : it));
    addLog(type, target.name, label, `Input manual merubah stok dari ${target.stock} ➔ ${n}`);
    await supabase.from("inventory_items").update({ stock: n }).eq("id", id);
  }

  async function removeItem(id: string, name: string) {
    if (!confirm(`Hapus "${name}" dari stok?`)) return;
    setItems(prev => prev.filter(it => it.id !== id));
    addLog("out", name, "Hapus Produk", "Barang dihapus permanen dari sistem dashboard");
    await supabase.from("inventory_items").delete().eq("id", id);
    toast(`"${name}" dihapus`);
  }

  function openEditModal(item: Item) {
    setEditingItem(item);
    setEditName(item.name);
    setEditMin(item.min.toString());
    setEditPrice((item.price / 1000).toString());
    setShowEditModal(true);
  }

  async function saveEditItem() {
    if (!editingItem) return;
    const nm = editName.trim();
    if (!nm) { toast("Nama barang wajib diisi", false); return; }
    const mn = parseInt(editMin);
    const prc = parseInt(editPrice) * 1000;

    const validMin = isNaN(mn) || mn < 0 ? 15 : mn;
    const validPrice = isNaN(prc) || prc < 0 ? 0 : prc;

    let perubahan: string[] = [];
    if (editingItem.name !== nm) perubahan.push(`Nama diganti`);
    if (editingItem.price !== validPrice) perubahan.push(`Harga: ${formatRupiah(editingItem.price)} ➔ ${formatRupiah(validPrice)}`);
    if (editingItem.min !== validMin) perubahan.push(`Batas Min: ${editingItem.min} ➔ ${validMin}`);
    
    setItems(prev => prev.map(it => it.id === editingItem.id ? { ...it, name: nm, min: validMin, price: validPrice } : it));
    if (perubahan.length > 0) {
      addLog("edit", nm, "Update Spesifikasi", perubahan.join(" | "));
    }

    await supabase.from("inventory_items").update({ name: nm, min: validMin, price: validPrice }).eq("id", editingItem.id);
    toast(`"${nm}" berhasil diperbarui`);
    setShowEditModal(false);
    setEditingItem(null);
  }

  async function addItem() {
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
    await supabase.from("inventory_items").insert([newItem]);
    
    toast(`"${nm}" ditambahkan`);
    setShowModal(false);
    setNewName(""); setNewStock("5"); setNewMin("15"); setNewPrice("0");
  }

  async function clearLogs() {
    if (!confirm("Apakah Anda yakin ingin menghapus semua riwayat aktivitas log ini di database pusat?")) return;
    setLogs([]);
    await supabase.from("inventory_logs").delete().neq("id", "placeholder");
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
        <span style={{ color:"#7C3AED", fontFamily:"Inter,sans-serif", fontSize:14 }}>Menghubungkan ke Database Cloud...</span>
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

      {/* ── HEADER ── */}
      <header style={S.header}>
        <div style={S.headerInner}>
          <div className="brand-container" style={S.brandContainer}>
            <div style={S.logoWrap}>
              <img className="logo-img" src="/logo-removebg.png" alt="Logo" style={{ height: "60px", width: "auto", objectFit: "contain" }} />
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
              <input className="inp search-input-box" style={S.searchInp} placeholder="Cari barang..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button style={S.btnAdd} onClick={() => setShowModal(true)}>
              <span style={{ fontSize:20, lineHeight:1, fontWeight:"bold" }}>+</span>
              <span className="hide-sm">Tambah</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── KONTEN UTAMA ── */}
      <main style={S.main}>

        {/* Ringkasan Statistik */}
        <div style={S.statsRow}>
          <StatCard label="Jenis Barang" value={totalTypes.toLocaleString("id-ID")} sub="item terdaftar" accent="#8B5CF6" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 10h16M4 14h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>} delay={0} />
          <StatCard label="Total Stok" value={totalStock.toLocaleString("id-ID")} sub="unit tersedia" accent="#A78BFA" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 7V5a2 2 0 0 0-4 0v2M8 7V5a2 2 0 0 0-4 0v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>} delay={60} />
          <StatCard label="Stok di Bawah Batas" value={lowCount.toLocaleString("id-ID")} sub="perlu order lagi" accent={lowCount > 0 ? "#F59E0B" : "#22C55E"} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>} delay={120} />
          <StatCard label="Nilai Inventory" value={formatRupiah(totalValue)} sub="total nilai modal" accent="#10B981" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>} delay={180} />
        </div>

        {/* ── Grafis Batas Stok ── */}
        <section className="card" style={{ ...S.card, animationDelay:"180ms" }}>
          <div style={S.cardHead}>
            <div>
              <div style={S.cardTitle}>Grafik Batas Stok</div>
              <div style={S.cardSub}>{chartView === "all" ? `Semua ${items.length} item` : `${lowCount} item stok rendah`} · <span style={{color: "#A78BFA"}}>Sinkronisasi Cloud Aktif</span></div>
            </div>
            <div style={{ display:"flex", gap:6, flexShrink:0 }}>
              {(["all","low"] as const).map(v => (
                <button key={v} className={`chip ${chartView === v ? "chip-active" : ""}`} style={S.chip(chartView === v)} onClick={() => setChartView(v)}>{v === "all" ? "Tampilkan Semua" : "⚠ Stok Rendah"}</button>
              ))}
            </div>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:10, paddingTop:4 }}>
            {chartItems.map((it) => {
              const pct   = maxStock > 0 ? (it.stock / maxStock) * 100 : 0;
              const h     = stockHealth(it.stock, it.min);
              return (
                <div key={it.id} className="bar-container" onClick={() => setSelectedChartItem(it)} style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div className="chart-label" style={{ width:150, minWidth:100, flexShrink:0, fontSize:13, color:"#A78BFA", fontWeight: 500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", textAlign:"right" }}>{it.name}</div>
                  <div style={{ flex:1, height:26, background:"rgba(255,255,255,.03)", borderRadius:6, overflow:"hidden", position:"relative" }}>
                    <div className="bar-fill" style={{ height:"100%", width:`${Math.max(pct, it.stock > 0 ? 1 : 0)}%`, background:`linear-gradient(90deg, ${HEALTH_COLOR[h]}CC, ${HEALTH_COLOR[h]})`, borderRadius:6, boxShadow:`0 0 10px ${HEALTH_GLOW[h]}` }} />
                  </div>
                  <div style={{ width:40, textAlign:"right", flexShrink:0, fontSize:14, fontWeight:700, color: HEALTH_COLOR[h] }}>{it.stock}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Tabel Utama Manajemen Stok ── */}
        <section className="card" style={{ ...S.card, padding:0, overflow:"hidden", animationDelay:"240ms" }}>
          <div style={{ ...S.cardHead, padding:"24px 24px 16px" }}>
            <div>
              <div style={S.cardTitle}>Manajemen Stok & Harga Produk</div>
              <div style={S.cardSub}>Terhubung ke HP Mama, Ayah, & Laptop</div>
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
                {filtered.map((it, idx) => {
                  const h = stockHealth(it.stock, it.min);
                  return (
                    <div key={it.id} className="row" style={{ ...S.tableRow, borderLeft:`4px solid ${HEALTH_COLOR[h]}`, animationDelay:`${idx * 12}ms` }}>
                      <div style={S.colName}>
                        <div style={{ width:8, height:8, borderRadius:"50%", background:HEALTH_COLOR[h], flexShrink:0 }} />
                        <span style={{ fontSize:14, color:"#E9E3FF", fontWeight:500 }}>{it.name}</span>
                      </div>
                      <div style={S.colPrice}>{formatRupiah(it.price)}</div>
                      <div style={S.colQtyContainer}>
                        <button className="btn-qty" onClick={() => decrement(it.id)} style={S.btnQty("#EF4444","rgba(239,68,68,.15)")}>−</button>
                        <input className="stock-inp inp" type="number" value={it.stock} onChange={e => editStock(it.id, e.target.value)} style={S.stockInp} />
                        <button className="btn-qty" onClick={() => increment(it.id)} style={S.btnQty("#22C55E","rgba(34,197,94,.15)")}>+</button>
                      </div>
                      <div style={S.colMin}>{it.min}</div>
                      <div style={S.colStatus}>
                        <span style={S.badge(h)}>{h === "ok" ? "✓ Aman" : h === "low" ? "⚠ Rendah" : "✕ Kritis"}</span>
                      </div>
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

        {/* ── KARTU RIWAYAT LOG AKTIVITAS (TANPA BATAS 100 & CLOUD SYNC) ── */}
        <section className="card" style={{ ...S.card, animationDelay:"300ms", padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={S.cardTitle}>Riwayat Aktivitas Log Toko</div>
              <div style={S.cardSub}>Mencatat seluruh aktivitas perubahan stok dan produk secara real-time</div>
            </div>
            {logs.length > 0 && (
              <button onClick={clearLogs} style={S.btnResetLog}>Bersihkan Log</button>
            )}
          </div>

          <div style={{ maxHeight: 380, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
            {logs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#4A4A7A", fontSize: 13, border: "1px dashed rgba(139,92,246,0.15)", borderRadius: 12 }}>Belum ada riwayat aktivitas log di database pusat.</div>
            ) : (
              logs.map((log) => {
                const sty = LOG_STYLES[log.type] || LOG_STYLES.edit;
                return (
                  <div key={log.id} style={S.logRow}>
                    <div className="log-meta-box" style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                      <span style={S.logBadge(sty.bg, sty.text)}>{sty.label}</span>
                      <span style={{ fontSize: 11, color: "#4A4A7A", whiteSpace: "nowrap" }}>{log.timestamp}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0, fontSize: 13 }}>
                      <span style={{ color: "#A78BFA", fontWeight: 600, marginRight: 6 }}>{log.itemName}</span>
                      <span style={{ color: "#E9E3FF", opacity: 0.85 }}>{log.action}</span>
                      {log.details && <div style={{ fontSize: 12, color: "#5B5B8A", marginTop: 2, fontStyle: "italic" }}>{log.details}</div>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

      </main>

      {/* ── MODAL TAMBAH & EDIT ── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}><div style={{ fontSize:18, fontWeight:700, color:"#FBBF24" }}>Tambah Barang Baru</div><button onClick={() => setShowModal(false)} style={S.btnClose}>✕</button></div>
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <label style={S.formLabel}>Nama Barang *<input className="inp" style={S.formInput} placeholder="Contoh: Biled 2.5 inch Matrix" value={newName} onChange={e => setNewName(e.target.value)} /></label>
              <label style={S.formLabel}>Harga (Ribuan)<input className="inp" style={S.formInput} type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} /></label>
              <label style={S.formLabel}>Stok Awal<input className="inp" style={S.formInput} type="number" value={newStock} onChange={e => setNewStock(e.target.value)} /></label>
              <label style={S.formLabel}>Batas Minimum<input className="inp" style={S.formInput} type="number" value={newMin} onChange={e => setNewMin(e.target.value)} /></label>
            </div>
            <div style={{ display:"flex", gap:12, justifyContent:"flex-end", marginTop:28 }}><button onClick={() => setShowModal(false)} style={S.btnCancel}>Batal</button><button onClick={addItem} style={S.btnSave}>Simpan</button></div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="modal-overlay" onClick={() => { setShowEditModal(false); setEditingItem(null); }}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}><div style={{ fontSize:18, fontWeight:700, color:"#E9E3FF" }}>Edit Spesifikasi Barang</div><button onClick={() => { setShowEditModal(false); setEditingItem(null); }} style={S.btnClose}>✕</button></div>
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <label style={S.formLabel}>Nama Produk<input className="inp" style={S.formInput} value={editName} onChange={e => setEditName(e.target.value)} /></label>
              <label style={S.formLabel}>Harga Baru (Ribuan)<input className="inp" style={S.formInput} type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)} /></label>
              <label style={S.formLabel}>Batas Minimum<input className="inp" style={S.formInput} type="number" value={editMin} onChange={e => setEditMin(e.target.value)} /></label>
            </div>
            <div style={{ display:"flex", gap:12, justifyContent:"flex-end", marginTop:28 }}><button onClick={() => { setShowEditModal(false); setEditingItem(null); }} style={S.btnCancel}>Batal</button><button onClick={saveEditItem} style={S.btnSave}>Simpan</button></div>
          </div>
        </div>
      )}

      {/* TOAST POPUP */}
      <div style={{ position:"fixed", bottom:24, right:24, zIndex:300, display:"flex", flexDirection:"column", gap:8 }}>
        {toasts.map(t => (
          <div key={t.id} style={{ background: t.ok ? "rgba(139,92,246,.9)" : "rgba(239,68,68,.9)", padding:"12px 20px", borderRadius:12, fontSize:14 }}>{t.msg}</div>
        ))}
      </div>
    </div>
  );
}

const S = {
  root: { minHeight:"100vh", background:"#0a0a12", fontFamily:"'Inter', sans-serif", color:"#E9E3FF" } as React.CSSProperties,
  header: { position:"sticky" as const, top:0, zIndex:100, background:"rgba(13,13,26,.96)", borderBottom:"1px solid rgba(139,92,246,.2)" },
  headerInner: { maxWidth: "1100px", margin:"0 auto", padding:"12px 24px", display:"flex", alignItems:"center", justifyContent:"space-between" } as React.CSSProperties,
  brandContainer: { display: "flex", alignItems: "center", gap: "10px" } as React.CSSProperties,
  logoWrap: { display: "flex", alignItems: "center" } as React.CSSProperties,
  textWrap: { display: "flex", flexDirection: "column" as const },
  logoTextPrimary: { fontFamily: "'Outfit', sans-serif", fontSize: "20px", fontWeight: 900, color: "#FFFFFF" },
  logoTextSecondary: { fontFamily: "'Outfit', sans-serif", fontSize: "20px", fontWeight: 900, color: "#FBBF24" },
  searchWrap: { display:"flex", alignItems:"center", gap:8, background:"rgba(139,92,246,.06)", border:"1px solid rgba(139,92,246,.15)", borderRadius:10, padding:"8px 14px" },
  searchInp: { background:"transparent", border:"none", color:"#fff", width:150 },
  btnAdd: { display:"flex", alignItems:"center", gap:6, padding:"10px 18px", background:"linear-gradient(135deg,#7C3AED,#6025C0)", color:"#fff", border:"none", borderRadius:10, fontWeight:600, cursor:"pointer" } as React.CSSProperties,
  main: { maxWidth: "1100px", margin:"0 auto", padding:"24px", display:"flex", flexDirection:"column" as const, gap:24 },
  statsRow: { display:"flex", gap:14, flexWrap:"wrap" as const },
  card: { background:"#13132a", border:"1px solid rgba(139,92,246,.15)", borderRadius:18, padding:"22px" } as React.CSSProperties,
  cardHead: { display:"flex", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap" as const },
  cardTitle: { fontSize:16, fontWeight:700, color:"#E9E3FF" },
  cardSub: { fontSize:12, color:"#5B5B8A", marginTop:4 },
  chip: (active: boolean): React.CSSProperties => ({ padding:"6px 14px", borderRadius:20, fontSize:12, cursor:"pointer", background: active ? "#7C3AED" : "transparent", color: active ? "#fff" : "#8B8BAD", border:"1px solid rgba(139,92,246,.2)" }),
  colName: { flex: "2 1 200px", display: "flex", alignItems: "center", gap: 10 },
  colPrice: { width: 140, color: "#10B981", fontWeight: 600 },
  colQtyContainer: { width: 130, display: "flex", alignItems: "center", gap: 6 },
  colMin: { width: 70, textAlign: "center" as const, color: "#8B8BAD" },
  colStatus: { width: 90, display: "flex" },
  colActions: { width: 90, display: "flex", gap: 8 },
  tableHeader: { display:"flex", padding:"12px 24px", borderBottom:"1px solid rgba(139,92,246,.15)", fontSize:11, color:"#5B5B8A", fontWeight:700, textTransform:"uppercase" as const, gap:8 },
  tableRow: { display:"flex", alignItems:"center", padding:"14px 24px", gap:8, borderBottom:"1px solid rgba(139,92,246,.08)" } as React.CSSProperties,
  btnQty: (color: string, bg: string): React.CSSProperties => ({ width:34, height:34, borderRadius:10, background:bg, color:color, border:"none", fontSize:18, cursor:"pointer" }),
  stockInp: { width:42, height:34, borderRadius:10, background:"rgba(139,92,246,.06)", border:"1px solid rgba(139,92,246,.25)", color:"#fff", textAlign:"center" as const, fontWeight:700 },
  badge: (h: "ok"|"low"|"critical"): React.CSSProperties => ({ padding:"4px 10px", borderRadius:20, fontSize:11, fontWeight:600, background: h === "ok" ? "rgba(139,92,246,.15)" : h === "low" ? "rgba(245,158,11,.15)" : "rgba(239,68,68,.15)", color: h === "ok" ? "#A78BFA" : h === "low" ? "#FBBF24" : "#FCA5A5" }),
  btnEdit: { background:"transparent", border:"none", color:"#A78BFA", cursor:"pointer", fontSize:16 },
  btnDel: { background:"transparent", border:"none", color:"#EF4444", cursor:"pointer", fontSize:16 },
  btnClose: { background:"transparent", border:"none", color:"#8B8BAD", cursor:"pointer" },
  formLabel: { display:"flex", flexDirection:"column" as const, gap:6, fontSize:13, color:"#8B8BAD" },
  formInput: { background:"#0a0a12", border:"1px solid rgba(139,92,246,.25)", borderRadius:10, padding:"12px", color:"#fff" },
  btnCancel: { padding:"11px 20px", borderRadius:10, background:"transparent", color:"#8B8BAD", border:"1px solid rgba(139,92,246,.2)", cursor:"pointer" },
  btnSave: { padding:"11px 22px", borderRadius:10, background:"linear-gradient(135deg,#7C3AED,#6025C0)", color:"#fff", border:"none", fontWeight:600, cursor:"pointer" },
  logRow: { display: "flex", alignItems: "flex-start", gap: 16, padding: "12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(139,92,246,0.08)", borderRadius: "12px" },
  logBadge: (bg: string, text: string): React.CSSProperties => ({ padding: "3px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: 700, background: bg, color: text, minWidth: "90px", display:"inline-block", textAlign:"center" }),
  btnResetLog: { padding: "6px 12px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "8px", color: "#FCA5A5", fontSize: "12px", cursor: "pointer" }
};

function StatCard({ label, value, sub, accent, icon, delay }: { label: string; value: string | number; sub: string; accent: string; icon: React.ReactNode; delay: number; }) {
  return (
    <div className="card" style={{ flex:"1 1 220px", background:"#13132a", border:"1px solid rgba(139,92,246,.15)", borderRadius:16, padding:"20px", display:"flex", alignItems:"center", gap:14, animationDelay:`${delay}ms` }}>
      <div style={{ width:42, height:42, borderRadius:12, background:`${accent}15`, display:"flex", alignItems:"center", justifyContent:"center", color:accent }}>{icon}</div>
      <div>
        <div style={{ fontSize:11, color:"#5B5B8A", textTransform:"uppercase", fontWeight:600 }}>{label}</div>
        <div style={{ fontSize:22, fontWeight:700, color:"#fff", marginTop:2 }}>{value}</div>
        <div style={{ fontSize:11, color:"#4A4A7A", marginTop:2 }}>{sub}</div>
      </div>
    </div>
  );
}