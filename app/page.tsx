"use client";

import { useState, useEffect } from "react";

// ── 1. DEFINISI TIPE DATA ──
interface StockItem {
  id: string;
  name: string;
  stock: number;
  category: string;
}

interface HistoryLog {
  id: string;
  timestamp: string;
  action: string;
  type: "stok_masuk" | "stok_keluar" | "add" | "remove" | "update";
}

// Helper ID Unik Sederhana
const uid = () => Math.random().toString(36).substring(2, 9);

export default function StockPage() {
  // ── 2. STATE UTAMA ──
  const [items, setItems] = useState<StockItem[]>([
    { id: "1", name: "Stepdown 5A", stock: 16, category: "Elektronik" },
    { id: "2", name: "Arduino Uno R3", stock: 25, category: "Mikrokontroler" },
    { id: "3", name: "Kabel Jumper Male-Female", stock: 120, category: "Aksesoris" },
  ]);

  const [logs, setLogs] = useState<HistoryLog[]>([
    {
      id: "init-1",
      timestamp: "Minggu, 14 Juni 2026 · 16.20.26",
      action: "Stepdown 5A Kurang 1 Pcs. Stok berubah dari 17 ➔ 16",
      type: "stok_keluar",
    },
  ]);

  // State Form Input Tambah Barang Baru
  const [newName, setNewName] = useState("");
  const [newStock, setNewStock] = useState<number>(0);
  const [newCategory, setNewCategory] = useState("Elektronik");

  // State Toast Notifikasi
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Auto-hide Toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // ── 3. FUNGSI LOGIKA ──
  const triggerToast = (message: string, type: "success" | "error" | "info") => {
    setToast({ message, type });
  };

  const addLog = (action: string, type: HistoryLog["type"]) => {
    const hariIni = new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const jamIni = new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const newLog: HistoryLog = {
      id: uid(),
      timestamp: `${hariIni} · ${jamIni}`,
      action,
      type,
    };
    setLogs((prev) => [newLog, ...prev].slice(0, 50)); // Batasi 50 log teratas
  };

  // Tambah Stok (+1) -> Hijau
  const incrementStock = (id: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id === id) {
          addLog(`"${it.name}" tambah 1 Pcs. Stok berubah dari ${it.stock} ➔ ${it.stock + 1}`, "stok_masuk");
          triggerToast(`Stok ${it.name} berhasil ditambah!`, "success");
          return { ...it, stock: it.stock + 1 };
        }
        return it;
      })
    );
  };

  // Kurangi Stok (-1) -> Merah
  const decrementStock = (id: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        if (it.stock <= 0) {
          triggerToast(`Stok ${it.name} sudah habis!`, "error");
          return it;
        }
        addLog(`"${it.name}" kurang 1 Pcs. Stok berubah dari ${it.stock} ➔ ${it.stock - 1}`, "stok_keluar");
        triggerToast(`Stok ${it.name} berhasil dikurangi!`, "info");
        return { ...it, stock: it.stock - 1 };
      })
    );
  };

  // Tambah Produk Baru -> Hijau
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return triggerToast("Nama barang tidak boleh kosong!", "error");

    const newItem: StockItem = {
      id: uid(),
      name: newName,
      stock: newStock,
      category: newCategory,
    };

    setItems((prev) => [...prev, newItem]);
    addLog(`Menambahkan produk baru: "${newName}" dengan stok awal ${newStock} (${newCategory})`, "add");
    triggerToast(`Produk "${newName}" berhasil ditambahkan!`, "success");

    // Reset Form
    setNewName("");
    setNewStock(0);
  };

  // Hapus Produk -> Merah
  const handleRemoveItem = (id: string, name: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
    addLog(`Menghapus produk "${name}" dari sistem toko`, "remove");
    triggerToast(`Produk "${name}" telah dihapus`, "error");
  };

  const clearLogs = () => {
    setLogs([]);
    triggerToast("Semua log riwayat dibersihkan", "info");
  };

  return (
    <div style={styles.wrapper}>
      {/* ── TOAST NOTIFIKASI INTERAKTIF ── */}
      {toast && (
        <div
          style={{
            ...styles.toast,
            backgroundColor:
              toast.type === "success" ? "#22C55E" : toast.type === "error" ? "#EF4444" : "#FBBF24",
          }}
        >
          {toast.message}
        </div>
      )}

      <div style={styles.container}>
        <header style={styles.header}>
          <h1 style={styles.mainTitle}>Dashboard Manajemen Stok</h1>
          <p style={styles.subTitle}>Kelola inventaris toko dengan sistem log real-time otomatis.</p>
        </header>

        {/* ── LAYOUT UTAMA (RESPONSIF GRID) ── */}
        <div style={styles.gridContainer}>
          
          {/* KIRI: FORM TAMBAH BARANG */}
          <section style={styles.card}>
            <h2 style={styles.cardTitle}>Tambah Produk Baru</h2>
            <form onSubmit={handleAddItem} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nama Barang</label>
                <input
                  type="text"
                  placeholder="Contoh: Stepdown 5A"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.formRow}>
                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label style={styles.label}>Stok Awal</label>
                  <input
                    type="number"
                    min="0"
                    value={newStock}
                    onChange={(e) => setNewStock(parseInt(e.target.value) || 0)}
                    style={styles.input}
                  />
                </div>
                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label style={styles.label}>Kategori</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    style={styles.select}
                  >
                    <option value="Elektronik">Elektronik</option>
                    <option value="Mikrokontroler">Mikrokontroler</option>
                    <option value="Aksesoris">Aksesoris</option>
                  </select>
                </div>
              </div>

              <button type="submit" style={styles.btnPrimary}>
                ＋ Daftarkan Produk
              </button>
            </form>
          </section>

          {/* KANAN: TABEL STOK BARANG */}
          <section style={styles.card}>
            <h2 style={styles.cardTitle}>Daftar Stok Produk</h2>
            
            {/* Pembungkus Tabel Agar Bisa Di-scroll Horizontal di HP */}
            <div style={styles.tableResponsive}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Produk</th>
                    <th style={styles.th}>Kategori</th>
                    <th style={styles.th} style={{ textAlign: "center" }}>Stok</th>
                    <th style={styles.th} style={{ textAlign: "center" }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} style={styles.tr}>
                      <td style={{ ...styles.td, fontWeight: 600, color: "#FFF" }}>{item.name}</td>
                      <td style={styles.td}><span style={styles.tag}>{item.category}</span></td>
                      <td style={{ ...styles.td, textAlign: "center", fontWeight: 700, fontSize: 16 }}>
                        {item.stock} <span style={{ fontSize: 11, color: "#71717A" }}>Pcs</span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actionCell}>
                          <button onClick={() => incrementStock(item.id)} style={styles.btnPlus}>＋</button>
                          <button onClick={() => decrementStock(item.id)} style={styles.btnMinus}>－</button>
                          <button onClick={() => handleRemoveItem(item.id, item.name)} style={styles.btnTrash}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* ── BAWAH: LOG RIWAYAT AKTIVITAS (SESUAI IMAGE_49013C.PNG) ── */}
        <section style={{ ...styles.card, marginTop: 24 }}>
          <div style={styles.logHeader}>
            <div>
              <h2 style={styles.cardTitle}>Riwayat Aktivitas Log Toko</h2>
              <p style={styles.cardSub}>Mencatat aktivitas perubahan stok dan produk secara real-time</p>
            </div>
            {logs.length > 0 && (
              <button onClick={clearLogs} style={styles.btnClearLog}>
                🗑 Bersihkan Log
              </button>
            )}
          </div>

          <div style={styles.logList}>
            {logs.length === 0 ? (
              <div style={styles.emptyLog}>Belum ada aktivitas terekam.</div>
            ) : (
              logs.map((log) => {
                // Definisi Warna Dinamis Sesuai Instruksi User
                let badgeLabel = "LOG";
                let themeColor = "#A855F7"; 
                let bgColor = "rgba(168,85,247,0.03)";

                if (log.type === "stok_masuk") {
                  badgeLabel = "STOK MASUK";
                  themeColor = "#22C55E"; // Hijau saat stok masuk
                  bgColor = "rgba(34,197,94,0.04)";
                } else if (log.type === "stok_keluar") {
                  badgeLabel = "STOK KELUAR";
                  themeColor = "#EF4444"; // Merah saat stok keluar
                  bgColor = "rgba(239,68,68,0.04)";
                } else if (log.type === "add") {
                  badgeLabel = "BARANG BARU";
                  themeColor = "#22C55E"; // Add barang baru = Hijau
                  bgColor = "rgba(34,197,94,0.04)";
                } else if (log.type === "remove") {
                  badgeLabel = "HAPUS BARANG";
                  themeColor = "#EF4444"; // Hapus barang = Merah
                  bgColor = "rgba(239,68,68,0.04)";
                } else if (log.type === "update") {
                  badgeLabel = "EDIT INFO";
                  themeColor = "#FBBF24"; // Edit = Kuning
                  bgColor = "rgba(251,191,36,0.04)";
                }

                return (
                  <div
                    key={log.id}
                    style={{
                      ...styles.logCard,
                      backgroundColor: bgColor,
                      borderLeft: `4px solid ${themeColor}`,
                    }}
                  >
                    <div style={styles.logMeta}>
                      <span style={{ ...styles.badge, color: themeColor, backgroundColor: `${themeColor}15` }}>
                        {badgeLabel}
                      </span>
                      <span style={styles.timestamp}>{log.timestamp}</span>
                    </div>
                    <div style={styles.logAction}>{log.action}</div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

// ── 4. STYLING DENGAN DUKUNGAN INTERAKTIF & MOBILE RESPONSIVE ──
const styles = {
  wrapper: {
    backgroundColor: "#0B0B1E",
    color: "#E2E8F0",
    minHeight: "100vh",
    padding: "16px",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
  },
  header: {
    marginBottom: "24px",
    textAlign: "center" as const,
  },
  mainTitle: {
    fontSize: "28px",
    fontWeight: 800,
    background: "linear-gradient(to right, #FFF, #A5B4FC)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    margin: "0 0 8px 0",
  },
  subTitle: {
    color: "#71717A",
    margin: 0,
    fontSize: "14px",
  },
  gridContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", // Ini rahasia biar otomatis turun ke bawah kalau di layar HP kecil!
    gap: "20px",
  },
  card: {
    backgroundColor: "#13132B",
    border: "1px solid rgba(255,255,255,0.04)",
    borderRadius: "16px",
    padding: "20px",
  },
  cardTitle: {
    fontSize: "18px",
    fontWeight: 700,
    color: "#FFF",
    margin: "0 0 4px 0",
  },
  cardSub: {
    fontSize: "13px",
    color: "#64748B",
    margin: "0 0 16px 0",
  },
  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "16px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "6px",
  },
  formRow: {
    display: "flex",
    gap: "12px",
  },
  label: {
    fontSize: "12px",
    fontWeight: 600,
    color: "#94A3B8",
  },
  input: {
    backgroundColor: "#1C1C3A",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "8px",
    padding: "10px 14px",
    color: "#FFF",
    fontSize: "14px",
    outline: "none",
  },
  select: {
    backgroundColor: "#1C1C3A",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "8px",
    padding: "10px 14px",
    color: "#FFF",
    fontSize: "14px",
    outline: "none",
    cursor: "pointer",
  },
  btnPrimary: {
    backgroundColor: "#4F46E5",
    color: "#FFF",
    border: "none",
    borderRadius: "8px",
    padding: "12px",
    fontWeight: 600,
    cursor: "pointer",
    marginTop: "8px",
  },
  tableResponsive: {
    overflowX: "auto" as const, // Menjamin tabel bisa di-geser kanan-kiri di layar HP biar gak ngerusak layout layout utama
    width: "100%",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    marginTop: "8px",
    minWidth: "400px", // Memastikan data tabel tetap proporsional di HP
  },
  th: {
    textAlign: "left" as const,
    padding: "12px 8px",
    color: "#64748B",
    fontSize: "12px",
    fontWeight: 600,
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  tr: {
    borderBottom: "1px solid rgba(255,255,255,0.03)",
  },
  td: {
    padding: "14px 8px",
    fontSize: "14px",
    color: "#CBD5E1",
  },
  tag: {
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "11px",
    color: "#94A3B8",
  },
  actionCell: {
    display: "flex",
    gap: "6px",
    justifyContent: "center",
  },
  btnPlus: {
    backgroundColor: "rgba(34,197,94,0.15)",
    color: "#22C55E",
    border: "none",
    borderRadius: "6px",
    width: "32px",
    height: "32px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  btnMinus: {
    backgroundColor: "rgba(239,68,68,0.15)",
    color: "#EF4444",
    border: "none",
    borderRadius: "6px",
    width: "32px",
    height: "32px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  btnTrash: {
    backgroundColor: "rgba(255,255,255,0.05)",
    color: "#94A3B8",
    border: "none",
    borderRadius: "6px",
    width: "32px",
    height: "32px",
    cursor: "pointer",
  },
  logHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
    flexWrap: "wrap" as const, // Turun ke bawah kalau di hp layar sempit
    gap: "12px",
  },
  btnClearLog: {
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.2)",
    padding: "6px 12px",
    borderRadius: "8px",
    color: "#EF4444",
    fontSize: "12px",
    cursor: "pointer",
    fontWeight: 600,
  },
  logList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px",
    maxHeight: "350px",
    overflowY: "auto" as const,
  },
  emptyLog: {
    textAlign: "center" as const,
    color: "#4A4A7A",
    fontSize: "13px",
    padding: "40px 0",
  },
  logCard: {
    padding: "14px 16px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.01)",
    display: "flex",
    flexDirection: "column" as const,
    gap: "6px",
  },
  logMeta: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap" as const,
  },
  badge: {
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "0.05em",
    padding: "3px 8px",
    borderRadius: "6px",
  },
  timestamp: {
    fontSize: "11px",
    color: "#5B5B8A",
  },
  logAction: {
    fontSize: "13px",
    color: "#E2E8F0",
    lineHeight: 1.4,
  },
  toast: {
    position: "fixed" as const,
    top: "20px",
    right: "20px",
    zIndex: 999,
    padding: "12px 20px",
    borderRadius: "8px",
    color: "#FFF",
    fontWeight: 600,
    fontSize: "14px",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
    animation: "fadeIn 0.2s ease",
  },
};