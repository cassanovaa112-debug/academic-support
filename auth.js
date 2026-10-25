import { api, notify, store } from "../api.js";

function afterLogin(vm, user) {
  store.user = user;
  notify(`Selamat datang, ${user.name.split(" ")[0]}!`);
  vm.$router.replace(vm.$route.query.next || "/dashboard");
}

export const Login = {
  data: () => ({ email: "", password: "", loading: false, error: "" }),
  methods: {
    async submit() {
      this.loading = true; this.error = "";
      try {
        const { user } = await api("/api/auth/login", { method: "POST", body: { email: this.email, password: this.password } });
        afterLogin(this, user);
      } catch (e) { this.error = e.message; }
      this.loading = false;
    },
  },
  template: `
  <section class="auth-page"><div class="card auth-card">
    <h1>Masuk</h1>
    <p class="muted">Pantau pesanan dan unduh hasil pekerjaan Anda.</p>
    <form @submit.prevent="submit">
      <p v-if="error" class="alert alert-error">{{ error }}</p>
      <label class="field"><span>Email</span><input type="email" v-model="email" required autocomplete="email" /></label>
      <label class="field"><span>Kata sandi</span><input type="password" v-model="password" required autocomplete="current-password" /></label>
      <button class="btn btn-primary btn-block" :disabled="loading">{{ loading ? 'Memproses…' : 'Masuk' }}</button>
    </form>
    <p class="small center mt-1">Belum punya akun? <router-link :to="{ path: '/daftar', query: $route.query }">Daftar gratis</router-link></p>
    <details class="demo-accounts"><summary>Akun demo</summary>
      <ul class="small"><li>Pelanggan: mahasiswa@demo.id / mahasiswa123</li><li>Admin: admin@academicsupport.id / admin123</li>
      <li>Editor: editor@academicsupport.id / editor123</li></ul></details>
  </div></section>`,
};

export const Register = {
  data: () => ({ form: { name: "", email: "", phone: "", password: "" }, loading: false, error: "" }),
  methods: {
    async submit() {
      this.loading = true; this.error = "";
      try {
        const { user } = await api("/api/auth/register", { method: "POST", body: this.form });
        afterLogin(this, user);
      } catch (e) { this.error = e.message; }
      this.loading = false;
    },
  },
  template: `
  <section class="auth-page"><div class="card auth-card">
    <h1>Daftar akun</h1>
    <p class="muted">Buat akun untuk memesan layanan dan memantau progres pesanan.</p>
    <form @submit.prevent="submit">
      <p v-if="error" class="alert alert-error">{{ error }}</p>
      <label class="field"><span>Nama lengkap</span><input v-model="form.name" required autocomplete="name" /></label>
      <label class="field"><span>Email</span><input type="email" v-model="form.email" required autocomplete="email" /></label>
      <label class="field"><span>No. WhatsApp</span><input v-model="form.phone" placeholder="08xxxxxxxxxx" autocomplete="tel" /></label>
      <label class="field"><span>Kata sandi</span><input type="password" v-model="form.password" required minlength="6" autocomplete="new-password" /></label>
      <button class="btn btn-primary btn-block" :disabled="loading">{{ loading ? 'Memproses…' : 'Daftar' }}</button>
    </form>
    <p class="small center mt-1">Sudah punya akun? <router-link :to="{ path: '/masuk', query: $route.query }">Masuk</router-link></p>
  </div></section>`,
};
