import React, { useState } from 'react';
import { X, PlusCircle, CheckCircle2 } from 'lucide-react';
import { PNBPRecord } from '../types/pnbp';
import { getKategoriFromItem, JENIS_PENDAPATAN_INFO } from '../utils/formatters';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddRecord: (record: PNBPRecord) => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onAddRecord,
}) => {
  const today = new Date();
  const todayStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/2026`;

  const [tanggal, setTanggal] = useState(todayStr);
  const [bulan, setBulan] = useState('Februari 2026');
  const [nama, setNama] = useState('');
  const [volume, setVolume] = useState<number>(1000);
  const [satuan, setSatuan] = useState('ekor');
  const [setoran, setSetoran] = useState<number>(1000000);
  const [akun, setAkun] = useState('425112');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) return;

    const newRec: PNBPRecord = {
      id: `trx-${Date.now()}`,
      tanggalTransaksi: tanggal.trim(),
      bulan: bulan.trim(),
      tahun: '2026',
      namaPenjualan: nama.trim(),
      totalVolume: Number(volume) || 1,
      satuan: satuan.trim(),
      totalSetoran: Number(setoran) || 0,
      jenisPendapatan: akun,
      kategori: getKategoriFromItem(nama, akun),
    };

    onAddRecord(newRec);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Tambah Transaksi PNBP Baru
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Data akan langsung terupdate ke dashboard secara real-time
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup form tambah"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="trx-tanggal" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Transaksi
              </label>
              <input
                id="trx-tanggal"
                type="text"
                placeholder="DD/MM/YYYY"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label htmlFor="trx-bulan" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Bulan
              </label>
              <select
                id="trx-bulan"
                value={bulan}
                onChange={(e) => setBulan(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="Januari 2026">Januari 2026</option>
                <option value="Februari 2026">Februari 2026</option>
                <option value="Maret 2026">Maret 2026</option>
                <option value="April 2026">April 2026</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="trx-nama" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nama Penjualan / Uraian
            </label>
            <input
              id="trx-nama"
              type="text"
              placeholder="Contoh: Benih Patin, Sewa Gedung Serbaguna..."
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="trx-volume" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Total Volume
              </label>
              <input
                id="trx-volume"
                type="number"
                min="1"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label htmlFor="trx-satuan" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Satuan
              </label>
              <select
                id="trx-satuan"
                value={satuan}
                onChange={(e) => setSatuan(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="ekor">ekor</option>
                <option value="Rp">Rp</option>
                <option value="Hari">Hari</option>
                <option value="Kg">Kg</option>
                <option value="unit">unit</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="trx-setoran" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Total Setoran (Rupiah)
              </label>
              <input
                id="trx-setoran"
                type="number"
                min="0"
                step="1000"
                value={setoran}
                onChange={(e) => setSetoran(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label htmlFor="trx-akun" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Akun PNBP
              </label>
              <select
                id="trx-akun"
                value={akun}
                onChange={(e) => setAkun(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {Object.entries(JENIS_PENDAPATAN_INFO).map(([code, info]) => (
                  <option key={code} value={code}>
                    {info.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Simpan Transaksi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
