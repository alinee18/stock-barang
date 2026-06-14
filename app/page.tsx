"use client";

import { useState } from "react";

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

const uid = () => Math.random().toString(36).substring(2, 9);

export default function StockPage() {
  // Data State Bawaan Asli Toko Kamu
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

  const [newName, setNewName] = useState("");
  const [newStock, setNewStock] = useState<number>(0);
  const [newCategory, setNewCategory] = useState("Elektronik");

  // ── 2. LOGIKA UPDATE STRUKTUR LOG WARNA ──
  const addLog = (action: string, type: HistoryLog["type"]) => {
    const hariIni = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const jamIni = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const newLog: HistoryLog = {
      id: uid(),
      timestamp: `${hariIni} · ${jamIni}`,
      action,
      type,
    };
    setLogs((prev) => [newLog, ...prev]);
  };

  const incrementStock = (id: string) => {
    setItems(prev => prev.map(it => {
      if (it.id === id) {
        addLog(`${it.name} Tambah 1 Pcs. Stok berubah dari ${it.stock} ➔ ${it.stock + 1}`, "stok_masuk");
        return { ...it, stock: it.stock + 1 };
      }
      return it;
    }));
  };

  const decrementStock = (id: string) => {
    setItems(prev => prev.map(it => {
      if (it.id !== id || it.stock <= 0) return it;
      addLog(`${it.name} Kurang 1 Pcs. Stok berubah dari ${it.stock} ➔ ${it.stock - 1}`, "stok_keluar");
      return { ...it, stock: it.stock - 1 };
    }));
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const newItem: StockItem = { id: uid(), name: newName, stock: newStock, category: newCategory };
    setItems(prev => [...prev, newItem]);
    addLog(`Tambah barang baru: "${newName}" dengan stok awal ${newStock}`, "add");
    setNewName("");
    setNewStock(0);
  };

  const handleRemoveItem = (id: string, name: string) => {
    setItems(prev => prev.filter(it => it.id !== id));
    addLog(`Hapus barang: "${name}" telah dihapus dari daftar`, "remove");
  };

  return (
    <div style={styles.wrapper}>
      {/* CSS Injection: Menangani responsivitas HP secara interaktif tanpa ngerusak kode inline asli */}
      <style>{`
        @media (max-width: 900px) {
          .main-layout { flex-direction: column !important; }
          .form-row { flex-direction: column !important; }
          .table-container { overflow-x: auto !important; }
        }
      `}</style>

      <div style={styles.container}>
        <header style={styles.header}>
          <h1 style={styles.mainTitle}>Dashboard Manajemen Stok</h1>
          <p style={styles.subTitle}>Kelola inventaris toko dengan sistem log real-time otomatis.</p>
        </header>

        {/* ── LAYOUT UTAMA (Horizontal Kiri-Kanan Tetap Seperti Semula) ── */}
        <div className="main-layout" style={{ display: "flex", gap: "24px", marginBottom: "24px" }}>
          
          {/* KRI: TAMBAH PRODUK BARU */}
          <section style={{ ...styles.card, flex: 1 }}>
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

              <div className="form-row" style={{ display: "flex", gap: "16px" }}>
                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label style={styles.label}>Stok Awal</label>
                  <input
                    type="number"
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
                + Daftarkan Produk
              </button>
            </form>
          </section>

          {/* KANAN: DAFTAR STOK PRODUK */}
          <section style={{ ...styles.card, flex: 1.2 }}>
            <h2 style={styles.cardTitle}>Daftar Stok Produk</h2>
            <div className="table-container" style={{ width: "100%" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Produk</th>
                    <th style={styles.th}>Kategori</th>
                    <th style={{ ...styles.th, textAlign: "center" }}>Stok</th>
                    <th style={{ ...styles.th, textAlign: "center" }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} style={styles.tr}>
                      <td style={{ ...styles.td, fontWeight: "bold" }}>{item.name}</td>
                      <td style={styles.td}>
                        <span style={styles.categoryTag}>{item.category}</span>
                      </td>
                      <td style={{ ...styles.td, textAlign: "center", fontWeight: "bold" }}>
                        {item.stock} <span style={{ fontSize: "11px", color: "#6B7280", fontWeight: "normal" }}>Pcs</span>
                      </td>
                      <td style={styles.td}>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                          <button type="button" onClick={() => incrementStock(item.id)} style={styles.btnPlus}>+</button>
                          <button type="button" onClick={() => decrementStock(item.id)} style={styles.btnMinus}>-</button>
                          <button type="button" onClick={() => handleRemoveItem(item.id, item.name)} style={styles.btnTrash}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* ── BAWAH: RIWAYAT AKTIVITAS LOG TOKO (WARNA EDITAN REQ & RESPONSIF) ── */}
        <section style={styles.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h2 style={styles.cardTitle}>Riwayat Aktivitas Log Toko</h2>
              <p style={styles.cardSub}>Mencatat aktivitas perubahan stok dan produk secara real-time</p>
            </div>
            <button onClick={() => setLogs([])} style={styles.btnClearLog}>
              🗑 Bersihkan Log
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {logs.map((log) => {
              // Pewarnaan dinamis murni berdasarkan tipe aktivitas
              let badgeLabel = "LOG";
              let themeColor = "#EF4444"; 

              if (log.type === "stok_masuk" || log.type === "add") {
                badgeLabel = log.type === "add" ? "ADD BARANG" : "STOK MASUK";
                themeColor = "#22C55E"; // Ijo/Hijau klo masuk atau add barang baru
              } else if (log.type === "stok_keluar") {
                badgeLabel = "STOK KELUAR";
                themeColor = "#EF4444"; // Merah klo keluar
              } else if (log.type === "remove") {
                badgeLabel = "HAPUS BARANG";
                themeColor = "#EF4444"; // Merah klo hapus
              } else if (log.type === "update") {
                badgeLabel = "EDIT INFO";
                themeColor = "#FBBF24"; // Kuning klo edit info
              }

              return (
                <div
                  key={log.id}
                  style={{
                    padding: "16px",
                    backgroundColor: "rgba(255, 255, 255, 0.02)",
                    borderRadius: "12px",
                    borderLeft: `4px solid ${themeColor}`, // Garis indikator dinamis
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: "bold",
                        padding: "3px 8px",
                        borderRadius: "4px",
                        backgroundColor: `${themeColor}20`,
                        color: themeColor,
                      }}
                    >
                      {badgeLabel}
                    </span>
                    <span style={{ fontSize: "12px", color: "#4B5563" }}>{log.timestamp}</span>
                  </div>
                  <div style={{ fontSize: "14px", color: "#D1D5DB" }}>{log.action}</div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

// ── CSS IN JS (TAMPILAN ASLI KAMU DARI IMAGE_48A843.PNG) ──
const styles = {
  wrapper: {
    backgroundColor: "#0A0A16",
    color: "#F3F4F6",
    minHeight: "100vh",
    padding: "40px 20px",
    fontFamily: "sans-serif",
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
  },
  header: {
    textAlign: "center" as const,
    marginBottom: "40px",
  },
  mainTitle: {
    fontSize: "32px",
    fontWeight: "bold",
    margin: "0 0 10px 0",
  },
  subTitle: {
    color: "#6B7280",
    margin: 0,
    fontSize: "14px",
  },
  card: {
    backgroundColor: "#111126",
    borderRadius: "12px",
    padding: "24px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  },
  cardTitle: {
    fontSize: "18px",
    fontWeight: "bold",
    margin: "0 0 4px 0",
  },
  cardSub: {
    fontSize: "13px",
    color: "#4B5563",
    margin: 0,
  },
  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "16px",
    marginTop: "16px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
  },
  label: {
    fontSize: "13px",
    color: "#9CA3AF",
  },
  input: {
    backgroundColor: "#181834",
    border: "1px solid #25254D",
    borderRadius: "6px",
    padding: "12px",
    color: "#FFF",
    outline: "none",
  },
  select: {
    backgroundColor: "#181834",
    border: "1px solid #25254D",
    borderRadius: "6px",
    padding: "12px",
    color: "#FFF",
    outline: "none",
  },
  btnPrimary: {
    backgroundColor: "#4F46E5",
    color: "#FFF",
    border: "none",
    borderRadius: "6px",
    padding: "14px",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "15px",
    marginTop: "8px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
  },
  th: {
    color: "#4B5563",
    fontSize: "13px",
    fontWeight: "normal",
    padding: "12px 8px",
    textAlign: "left" as const,
    borderBottom: "1px solid #1F1F42",
  },
  tr: {
    borderBottom: "1px solid #1F1F42",
  },
  td: {
    padding: "16px 8px",
    fontSize: "14px",
  },
  categoryTag: {
    backgroundColor: "#181834",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    color: "#6B7280",
  },
  btnPlus: {
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    color: "#22C55E",
    border: "none",
    padding: "6px 12px",
    borderRadius: "4px",
    cursor: "pointer",
  },
  btnMinus: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    color: "#EF4444",
    border: "none",
    padding: "6px 12px",
    borderRadius: "4px",
    cursor: "pointer",
  },
  btnTrash: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    color: "#4B5563",
    border: "none",
    padding: "6px 10px",
    borderRadius: "4px",
    cursor: "pointer",
  },
  btnClearLog: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    color: "#EF4444",
    border: "none",
    padding: "6px 12px",
    borderRadius: "6px",
    fontSize: "12px",
    cursor: "pointer",
  },
};