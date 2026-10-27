import React, { useState } from "react";
import {
  Lock,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  X,
  AlertCircle,
  CheckCircle2,
  LogOut,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import {
  verifyAdminPassword,
  updateAdminPassword,
  getAdminPassword,
  setAdminLoggedIn,
} from "../services/adminService";

interface AdminModalProps {
  isOpen: boolean;
  isAdmin: boolean;
  onClose: () => void;
  onAdminLoginSuccess: () => void;
  onAdminLogout: () => void;
  spreadsheetId?: string;
  accessToken?: string | null;
  triggerReason?: string;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  isAdmin,
  onClose,
  onAdminLoginSuccess,
  onAdminLogout,
  spreadsheetId,
  accessToken,
  triggerReason,
}) => {
  const [activeTab, setActiveTab] = useState<"login" | "change">(
    isAdmin ? "change" : "login"
  );
  
  // Login Form State
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [changeStatus, setChangeStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });
  const [isUpdating, setIsUpdating] = useState(false);

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginPassword) {
      setLoginError("Masukkan password admin.");
      return;
    }

    if (verifyAdminPassword(loginPassword)) {
      setAdminLoggedIn(true);
      setLoginPassword("");
      onAdminLoginSuccess();
      onClose();
    } else {
      setLoginError("Password admin salah. Coba lagi atau gunakan password awal: admin123");
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangeStatus({ type: null, message: "" });

    if (!verifyAdminPassword(currentPassword)) {
      setChangeStatus({
        type: "error",
        message: "Password saat ini tidak cocok.",
      });
      return;
    }

    if (newPassword.length < 4) {
      setChangeStatus({
        type: "error",
        message: "Password baru minimal 4 karakter.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setChangeStatus({
        type: "error",
        message: "Konfirmasi password baru tidak sesuai.",
      });
      return;
    }

    setIsUpdating(true);
    try {
      const result = await updateAdminPassword(newPassword, spreadsheetId, accessToken);
      if (result.success) {
        setChangeStatus({
          type: "success",
          message: result.message,
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setChangeStatus({
          type: "error",
          message: result.message,
        });
      }
    } catch (err: any) {
      setChangeStatus({
        type: "error",
        message: err.message || "Gagal memperbarui password.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden transition-all">
        {/* Header with vibrant emerald/teal accent */}
        <div className="p-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white relative">
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="absolute top-5 right-5 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 text-white shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold tracking-tight">
                  {isAdmin ? "Panel Akses Admin" : "Autentikasi Admin"}
                </h3>
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                  {isAdmin ? "Aktif" : "Terkunci"}
                </span>
              </div>
              <p className="text-xs text-emerald-100 mt-0.5">
                {isAdmin
                  ? "Kelola hak sinkronisasi dan keamanan sistem"
                  : "Hanya admin yang dapat menyinkronkan data Google Sheets"}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {triggerReason && !isAdmin && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Akses Terbatas Admin:</span>
                <span>{triggerReason}</span>
              </div>
            </div>
          )}

          {/* Tab Selector if Admin is logged in */}
          {isAdmin && (
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab("change")}
                className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === "change"
                    ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Ubah Password</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onAdminLogout();
                  setActiveTab("login");
                }}
                className="flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar Admin</span>
              </button>
            </div>
          )}

          {/* Form 1: Admin Login */}
          {(!isAdmin || activeTab === "login") && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Password Admin
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Masukkan password admin..."
                    autoFocus
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    Password awal: <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded text-emerald-600 dark:text-emerald-400 font-bold">admin123</code>
                  </span>
                </div>
              </div>

              {loginError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Masuk Sebagai Admin</span>
                </button>
              </div>
            </form>
          )}

          {/* Form 2: Change Admin Password */}
          {isAdmin && activeTab === "change" && (
            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Password Saat Ini
                  </label>
                  <input
                    type={showChangePassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Password admin sekarang..."
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Password Baru
                  </label>
                  <input
                    type={showChangePassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 4 karakter..."
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Konfirmasi Password Baru
                  </label>
                  <input
                    type={showChangePassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi password baru..."
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowChangePassword(!showChangePassword)}
                    className="text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 cursor-pointer"
                  >
                    {showChangePassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showChangePassword ? "Sembunyikan Password" : "Lihat Password"}</span>
                  </button>
                  <span className="text-[10px] text-slate-400">Disimpan ke Google Sheets &amp; Lokal</span>
                </div>
              </div>

              {changeStatus.type && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                    changeStatus.type === "success"
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                      : "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400"
                  }`}
                >
                  {changeStatus.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  )}
                  <span>{changeStatus.message}</span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {isUpdating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Simpan Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
