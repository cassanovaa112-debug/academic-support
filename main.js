import { api, loadSession, notify, store } from "./api.js";
import { registerComponents } from "./components.js";
import { About, Contact, Home, Services } from "./pages/public.js";
import { Login, Register } from "./pages/auth.js";
import { Dashboard, Orders } from "./pages/dashboard.js";
import { OrderNew } from "./pages/order-new.js";
import { OrderDetail } from "./pages/order-detail.js";
import { AdminPanel } from "./pages/admin.js";

const { createApp } = Vue;
const { createRouter, createWebHistory } = VueRouter;

const NotFound = {
  template: `<section class="auth-page"><EmptyState icon="search" title="Halaman tidak ditemukan" text="Tautan yang Anda buka tidak tersedia.">
    <router-link to="/" class="btn btn-primary">Kembali ke beranda</router-link></EmptyState></section>`,
};

const routes = [
  { path: "/", component: Home, meta: { title: "Beranda" } },
  { path: "/tentang", component: About, meta: { title: "Tentang Kami" } },
  { path: "/layanan", component: Services, meta: { title: "Layanan & Harga" } },
  { path: "/kontak", component: Contact, meta: { title: "Kontak" } },
  { path: "/masuk", component: Login, meta: { title: "Masuk", guest: true } },
  { path: "/daftar", component: Register, meta: { title: "Daftar", guest: true } },
  { path: "/dashboard", component: Dashboard, meta: { title: "Dashboard", auth: true } },
  { path: "/pesanan", component: Orders, meta: { title: "Pesanan", auth: true } },
  { path: "/pesanan/:id", component: OrderDetail, meta: { title: "Detail Pesanan", auth: true } },
  { path: "/pesan", component: OrderNew, meta: { title: "Pesan Layanan", auth: true, roles: ["customer"] } },
  { path: "/admin", component: AdminPanel, meta: { title: "Kelola", auth: true, roles: ["admin"] } },
  { path: "/:pathMatch(.*)*", component: NotFound, meta: { title: "Tidak ditemukan" } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: (to, from, saved) => saved || { top: 0 },
});

router.beforeEach(async (to) => {
  if (!store.loaded) await loadSession();
  if (to.meta.auth && !store.user) return { path: "/masuk", query: { next: to.fullPath } };
  if (to.meta.guest && store.user) return "/dashboard";
  if (to.meta.roles && !to.meta.roles.includes(store.user.role)) {
    notify("Halaman ini khusus untuk " + to.meta.roles.join("/") + ".", "error");
    return "/dashboard";
  }
});
router.afterEach((to) => { document.title = `${to.meta.title} · Academic Support Service`; });

const App = {
  data: () => ({ store, menuOpen: false, year: new Date().getFullYear() }),
  watch: { $route() { this.menuOpen = false; } },
  methods: {
    async logout() {
      await api("/api/auth/logout", { method: "POST" });
      store.user = null;
      notify("Anda telah keluar.");
      this.$router.push("/");
    },
  },
  template: `
  <header class="nav">
    <div class="container nav-inner">
      <router-link to="/" class="brand"><span class="brand-mark"><Icon name="grad" :size="20" /></span>
        <span>Academic Support<small>Service</small></span></router-link>
      <button class="nav-toggle" @click="menuOpen = !menuOpen" :aria-expanded="menuOpen" aria-label="Menu"><Icon :name="menuOpen ? 'x' : 'menu'" /></button>
      <nav class="nav-links" :class="{ open: menuOpen }">
        <router-link to="/" exact-active-class="active">Beranda</router-link>
        <router-link to="/tentang" active-class="active">Tentang</router-link>
        <router-link to="/layanan" active-class="active">Layanan</router-link>
        <router-link to="/kontak" active-class="active">Kontak</router-link>
        <template v-if="store.user">
          <router-link to="/dashboard" class="btn btn-sm btn-primary">Dashboard</router-link>
          <button class="btn btn-sm btn-link" @click="logout">Keluar</button>
        </template>
        <template v-else>
          <router-link to="/masuk" class="btn btn-sm btn-link">Masuk</router-link>
          <router-link to="/pesan" class="btn btn-sm btn-accent">Pesan Sekarang</router-link>
        </template>
      </nav>
    </div>
  </header>

  <main><router-view /></main>

  <footer class="footer">
    <div class="container footer-grid">
      <div><div class="brand light"><span class="brand-mark"><Icon name="grad" :size="20" /></span><span>Academic Support<small>Service</small></span></div>
        <p>Jasa pendampingan akademik untuk mahasiswa: editing & proofreading, formatting dokumen, presentation support, dan tutoring.</p></div>
      <div><h4>Layanan</h4><router-link to="/layanan">Editing & Proofreading</router-link><router-link to="/layanan">Formatting Dokumen</router-link>
        <router-link to="/layanan">Presentation Support</router-link><router-link to="/layanan">Tutoring</router-link></div>
      <div><h4>Perusahaan</h4><router-link to="/tentang">Tentang Kami</router-link><router-link to="/kontak">Kontak</router-link><router-link to="/masuk">Masuk</router-link></div>
      <div><h4>Hubungi</h4><p>WhatsApp 0812-0000-0001<br>halo@academicsupport.id<br>Bangkinang, Kampar, Riau</p></div>
    </div>
    <div class="container footer-bottom">© {{ year }} Academic Support Service · Tim Bisnis Digital, Universitas Pahlawan Tuanku Tambusai</div>
  </footer>

  <transition name="fade"><div v-if="store.toast" :key="store.toast.id" class="toast" :class="store.toast.type" role="status">{{ store.toast.message }}</div></transition>`,
};

const app = createApp(App);
registerComponents(app);
app.use(router);
app.mount("#app");
