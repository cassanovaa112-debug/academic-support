import { api, formatDate, notify, ROLE_LABELS, rupiah, store } from "../api.js";
import { DashShell } from "./dashboard.js";

export const AdminPanel = {
  components: { DashShell },
  data: () => ({
    services: [], users: [], messages: [],
    staff: { name: "", email: "", role: "editor", title: "", phone: "", password: "" },
    store,
  }),
  computed: {
    tab() { return this.$route.query.tab || "services"; },
    tabs: () => [{ key: "services", label: "Layanan & Harga" }, { key: "users", label: "Tim & Pengguna" }, { key: "messages", label: "Pesan Kontak" }],
  },
  watch: { tab() { this.load(); } },
  created() { this.load(); },
  methods: {
    rupiah, formatDate,
    roleLabel: (r) => ROLE_LABELS[r],
    async load() {
      if (this.tab === "services") this.services = (await api("/api/admin/services")).services;
      if (this.tab === "users") this.users = (await api("/api/admin/users")).users;
      if (this.tab === "messages") this.messages = (await api("/api/admin/messages")).messages;
    },
    async saveService(s) {
      try {
        const body = { base_price: s.base_price, included_units: s.included_units, extra_unit_price: s.extra_unit_price,
                       turnaround_days: s.turnaround_days, active: s.active };
        await api(`/api/admin/services/${s.id}`, { method: "PUT", body });
        notify(`${s.name} disimpan.`);
      } catch (e) { notify(e.message, "error"); }
    },
    async addStaff() {
      try {
        await api("/api/admin/users", { method: "POST", body: this.staff });
        notify("Akun staf dibuat.");
        this.staff = { name: "", email: "", role: "editor", title: "", phone: "", password: "" };
        this.load();
      } catch (e) { notify(e.message, "error"); }
    },
    async toggleUser(u) {
      try {
        const { user } = await api(`/api/admin/users/${u.id}`, { method: "PATCH", body: { active: !u.active } });
        u.active = user.active;
      } catch (e) { notify(e.message, "error"); }
    },
    async markRead(m) {
      const { message } = await api(`/api/admin/messages/${m.id}`, { method: "PATCH", body: { is_read: !m.is_read } });
      m.is_read = message.is_read;
    },
  },
  template: `
  <DashShell>
    <div class="page-title"><h1>Kelola</h1></div>
    <div class="tabs mb-1"><router-link v-for="t in tabs" :key="t.key" :to="{ query: { tab: t.key } }" class="tab" :class="{ active: tab === t.key }">{{ t.label }}</router-link></div>

    <div v-if="tab === 'services'" class="table-wrap">
      <table class="table">
        <thead><tr><th>Layanan</th><th>Harga dasar</th><th>Termasuk</th><th>Tambahan/unit</th><th>Hari</th><th>Aktif</th><th></th></tr></thead>
        <tbody><tr v-for="s in services" :key="s.id">
          <td><strong>{{ s.name }}</strong><div class="small muted">per {{ s.unit_label }}</div></td>
          <td><input class="input-sm" type="number" min="0" v-model.number="s.base_price" /></td>
          <td><input class="input-sm narrow" type="number" min="1" v-model.number="s.included_units" /></td>
          <td><input class="input-sm" type="number" min="0" v-model.number="s.extra_unit_price" /></td>
          <td><input class="input-sm narrow" type="number" min="1" v-model.number="s.turnaround_days" /></td>
          <td><input type="checkbox" v-model="s.active" /></td>
          <td><button class="btn btn-sm btn-primary" @click="saveService(s)">Simpan</button></td>
        </tr></tbody>
      </table>
    </div>

    <div v-if="tab === 'users'" class="grid-admin-users">
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th>Nama</th><th>Peran</th><th>Kontak</th><th>Status</th></tr></thead>
          <tbody><tr v-for="u in users" :key="u.id">
            <td><strong>{{ u.name }}</strong><div class="small muted">{{ u.title || '' }}</div></td>
            <td>{{ roleLabel(u.role) }}</td>
            <td class="small">{{ u.email }}<br>{{ u.phone || '' }}</td>
            <td><button class="btn btn-sm" :class="u.active ? 'btn-outline' : 'btn-danger-outline'" :disabled="u.id === store.user.id" @click="toggleUser(u)">{{ u.active ? 'Aktif' : 'Nonaktif' }}</button></td>
          </tr></tbody>
        </table>
      </div>
      <form class="card pad" @submit.prevent="addStaff">
        <h2>Tambah staf</h2>
        <label class="field"><span>Nama</span><input v-model="staff.name" required /></label>
        <label class="field"><span>Email</span><input type="email" v-model="staff.email" required /></label>
        <div class="grid-2 tight">
          <label class="field"><span>Peran</span><select v-model="staff.role"><option value="editor">Editor</option><option value="admin">Admin</option></select></label>
          <label class="field"><span>No. HP</span><input v-model="staff.phone" /></label>
        </div>
        <label class="field"><span>Jabatan</span><input v-model="staff.title" placeholder="Contoh: Academic Editor" /></label>
        <label class="field"><span>Kata sandi awal</span><input type="password" v-model="staff.password" minlength="6" required /></label>
        <button class="btn btn-primary btn-block">Buat Akun</button>
      </form>
    </div>

    <div v-if="tab === 'messages'">
      <EmptyState v-if="!messages.length" icon="mail" title="Belum ada pesan masuk" />
      <article v-for="m in messages" :key="m.id" class="card pad message" :class="{ unread: !m.is_read }">
        <div class="tl-head"><strong>{{ m.name }}</strong><span class="small muted">{{ m.email }} {{ m.phone }}</span>
          <span class="small muted tl-time">{{ formatDate(m.created_at, true) }}</span></div>
        <h3 v-if="m.subject">{{ m.subject }}</h3>
        <p>{{ m.message }}</p>
        <div class="btn-row">
          <a v-if="m.phone" class="btn btn-sm btn-outline" target="_blank" rel="noopener" :href="'https://wa.me/' + m.phone.replace(/^0/, '62').replace(/\\D/g, '')">Balas via WhatsApp</a>
          <a v-if="m.email" class="btn btn-sm btn-outline" :href="'mailto:' + m.email">Balas via Email</a>
          <button class="btn btn-sm btn-link" @click="markRead(m)">{{ m.is_read ? 'Tandai belum dibaca' : 'Tandai sudah dibaca' }}</button>
        </div>
      </article>
    </div>
  </DashShell>`,
};
