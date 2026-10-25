const { reactive } = Vue;

export const store = reactive({
  user: null,
  loaded: false,
  meta: { status_labels: {}, payment_methods: [], citation_styles: [] },
  toast: null,
});

export async function api(path, { method = "GET", body, form } = {}) {
  const opts = { method, credentials: "same-origin", headers: {} };
  if (form) {
    opts.body = form; // FormData: browser mengatur boundary multipart
  } else if (body !== undefined) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(path, opts);
  let data = {};
  try { data = await res.json(); } catch (_) { /* respons non-JSON */ }
  if (!res.ok) {
    const err = new Error(data.error || `Terjadi kesalahan (${res.status}).`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export async function loadSession() {
  const [me, meta] = await Promise.all([api("/api/auth/me"), api("/api/meta")]);
  store.user = me.user;
  store.meta = meta;
  store.loaded = true;
}

export function notify(message, type = "success") {
  store.toast = { message, type, id: Date.now() };
  setTimeout(() => { if (store.toast && Date.now() - store.toast.id >= 3500) store.toast = null; }, 3600);
}

export const rupiah = (n) => (n < 0 ? "−" : "") + "Rp" + Math.abs(Number(n || 0)).toLocaleString("id-ID");

export function formatDate(value, withTime = false) {
  if (!value) return "-";
  const d = new Date(value);
  const opts = { day: "numeric", month: "short", year: "numeric" };
  if (withTime) Object.assign(opts, { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleString("id-ID", opts);
}

export function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
  return (bytes / 1024 / 1024).toFixed(1) + " MB";
}

export function daysLeft(dateStr) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.round((new Date(dateStr + "T00:00:00") - today) / 86400000);
}

export const ROLE_LABELS = { customer: "Pelanggan", admin: "Admin", editor: "Editor" };

export const WA_NUMBER = "6281200000001";
export const waLink = (text = "Halo Academic Support Service, saya ingin bertanya tentang layanan.") =>
  `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
