import { api, daysLeft, formatDate, ROLE_LABELS, rupiah, store } from "../api.js";

export const DashShell = {
  computed: {
    user() { return store.user; },
    links() {
      const role = this.user?.role;
      const links = [{ to: "/dashboard", icon: "chart", label: "Dashboard" },
                     { to: "/pesanan", icon: "doc", label: role === "editor" ? "Tugas Saya" : "Pesanan" }];
      if (role === "customer") links.push({ to: "/pesan", icon: "upload", label: "Pesan Baru" });
      if (role === "admin") links.push({ to: "/admin", icon: "users", label: "Kelola" });
      return links;
    },
    roleLabel() { return ROLE_LABELS[this.user?.role]; },
  },
  template: `
  <div class="dash container">
    <aside class="dash-side">
      <div class="dash-user"><div class="avatar sm">{{ user.name.charAt(0) }}</div>
        <div><strong>{{ user.name }}</strong><span class="small muted">{{ user.title || roleLabel }}</span></div></div>
      <nav><router-link v-for="l in links" :key="l.to" :to="l.to" class="dash-link"><Icon :name="l.icon" :size="18" />{{ l.label }}</router-link></nav>
    </aside>
    <div class="dash-main"><slot /></div>
  </div>`,
};

export const OrderTable = {
  props: { orders: Array, showCustomer: Boolean },
  methods: { rupiah, formatDate, daysLeft },
  template: `
  <div class="table-wrap">
    <table class="table">
      <thead><tr><th>Kode</th><th>Pesanan</th><th v-if="showCustomer">Pelanggan</th><th>Deadline</th><th>Biaya</th><th>Status</th></tr></thead>
      <tbody>
        <tr v-for="o in orders" :key="o.id" @click="$router.push('/pesanan/' + o.id)" class="clickable">
          <td class="mono">{{ o.code }}</td>
          <td><strong>{{ o.title }}</strong><div class="small muted">{{ o.service.name }} · {{ o.quantity }} {{ o.service.unit_label }}<span v-if="o.express" class="tag">Ekspres</span></div></td>
          <td v-if="showCustomer">{{ o.customer.name }}</td>
          <td>{{ formatDate(o.deadline) }}
            <div class="small" :class="daysLeft(o.deadline) <= 1 ? 'text-danger' : 'muted'"
                 v-if="!['SELESAI','DIBATALKAN','DITOLAK'].includes(o.status)">{{ daysLeft(o.deadline) < 0 ? 'lewat' : daysLeft(o.deadline) + ' hari lagi' }}</div></td>
          <td>{{ rupiah(o.price) }}</td>
          <td><StatusBadge :status="o.status" /></td>
        </tr>
      </tbody>
    </table>
  </div>`,
};

export const Dashboard = {
  components: { DashShell, OrderTable },
  data: () => ({ orders: [], summary: null, loading: true }),
  computed: {
    user() { return store.user; },
    role() { return store.user.role; },
    customerCards() {
      const count = (...st) => this.orders.filter((o) => st.includes(o.status)).length;
      return [
        { label: "Perlu tindakan Anda", value: count("MENUNGGU_PEMBAYARAN", "DIKIRIM"), hint: "bayar / periksa hasil", tone: "accent" },
        { label: "Sedang diproses", value: count("MENUNGGU_REVIEW", "VERIFIKASI_PEMBAYARAN", "DIKERJAKAN", "QUALITY_CHECK", "REVISI") },
        { label: "Selesai", value: count("SELESAI") },
      ];
    },
    bepPercent() {
      const m = this.summary?.month;
      return m && m.bep_orders ? Math.min(100, Math.round((m.orders_paid / m.bep_orders) * 100)) : 0;
    },
  },
  async created() {
    const reqs = [api("/api/orders?status=" + (this.role === "customer" ? "" : "active"))];
    if (this.role !== "customer") reqs.push(api("/api/admin/summary"));
    const [o, s] = await Promise.all(reqs);
    this.orders = o.orders;
    this.summary = s || null;
    this.loading = false;
  },
  methods: { rupiah },
  template: `
  <DashShell>
    <div class="page-title">
      <div><h1>Halo, {{ user.name.split(' ')[0] }} 👋</h1>
        <p class="muted" v-if="role === 'customer'">Pantau progres pesanan Anda di sini.</p>
        <p class="muted" v-else-if="role === 'admin'">Ringkasan operasional dan keuangan bulan ini.</p>
        <p class="muted" v-else>Tugas editing yang ditugaskan kepada Anda.</p></div>
      <router-link v-if="role === 'customer'" to="/pesan" class="btn btn-accent">+ Pesan Layanan</router-link>
    </div>

    <p v-if="loading" class="muted">Memuat…</p>
    <template v-else>
      <!-- Pelanggan -->
      <template v-if="role === 'customer'">
        <div class="kpi-grid">
          <div class="kpi" v-for="c in customerCards" :key="c.label" :class="c.tone">
            <span>{{ c.label }}</span><strong>{{ c.value }}</strong><small v-if="c.hint" class="muted">{{ c.hint }}</small></div>
        </div>
        <h2 class="mt-2">Pesanan terbaru</h2>
        <OrderTable v-if="orders.length" :orders="orders.slice(0, 6)" />
        <EmptyState v-else icon="doc" title="Belum ada pesanan" text="Mulai dengan memilih layanan dan mengunggah dokumen Anda.">
          <router-link to="/pesan" class="btn btn-primary">Buat pesanan pertama</router-link>
        </EmptyState>
      </template>

      <!-- Admin -->
      <template v-else-if="role === 'admin'">
        <div class="kpi-grid">
          <router-link class="kpi accent" to="/pesanan?status=MENUNGGU_REVIEW"><span>Pesanan perlu direview</span><strong>{{ summary.needs_action.review }}</strong></router-link>
          <router-link class="kpi accent" to="/pesanan?status=VERIFIKASI_PEMBAYARAN"><span>Pembayaran perlu diverifikasi</span><strong>{{ summary.needs_action.payment }}</strong></router-link>
          <router-link class="kpi accent" to="/pesanan?status=QUALITY_CHECK"><span>Hasil menunggu quality check</span><strong>{{ summary.needs_action.qc }}</strong></router-link>
          <router-link class="kpi" to="/admin?tab=messages"><span>Pesan kontak belum dibaca</span><strong>{{ summary.unread_messages }}</strong></router-link>
        </div>

        <div class="grid-2 mt-2">
          <div class="card pad">
            <h2>Ekonomi unit bulan ini</h2>
            <dl class="econ">
              <dt>Pesanan terbayar</dt><dd>{{ summary.month.orders_paid }}</dd>
              <dt>Pendapatan</dt><dd>{{ rupiah(summary.month.revenue) }}</dd>
              <dt>Biaya variabel</dt><dd>− {{ rupiah(summary.month.variable_cost) }}</dd>
              <dt>Margin kontribusi</dt><dd>{{ rupiah(summary.month.contribution) }}</dd>
              <dt>Biaya tetap (domain, hosting, kuota)</dt><dd>− {{ rupiah(summary.month.fixed_cost) }}</dd>
              <dt>Anggaran promosi</dt><dd>− {{ rupiah(summary.month.promo_cost) }}</dd>
              <dt class="total">Laba bersih</dt><dd class="total" :class="summary.month.net_profit < 0 ? 'text-danger' : 'text-success'">{{ rupiah(summary.month.net_profit) }}</dd>
              <dt>Bagi hasil per anggota (1/3)</dt><dd>{{ rupiah(summary.month.profit_share) }}</dd>
            </dl>
          </div>
          <div class="card pad">
            <h2>Titik impas</h2>
            <p class="muted small">Target minimal {{ summary.month.bep_orders }} pesanan/bulan untuk menutup biaya tetap (LKM P1, C.6).</p>
            <div class="progress"><div :style="{ width: bepPercent + '%' }"></div></div>
            <p class="small"><strong>{{ summary.month.orders_paid }}</strong> dari {{ summary.month.bep_orders }} pesanan ({{ bepPercent }}%)</p>
            <h2 class="mt-2">Beban kerja editor</h2>
            <ul class="workload"><li v-for="e in summary.workload" :key="e.id"><span>{{ e.name }}</span><span class="muted small">{{ e.active }} aktif · {{ e.done }} selesai</span></li></ul>
            <p class="small muted mt-1" v-if="summary.avg_rating">Rata-rata rating pelanggan: <strong>{{ summary.avg_rating }}/5</strong></p>
          </div>
        </div>

        <h2 class="mt-2">Pesanan aktif</h2>
        <OrderTable v-if="orders.length" :orders="orders" show-customer />
        <EmptyState v-else title="Tidak ada pesanan aktif" />
      </template>

      <!-- Editor -->
      <template v-else>
        <div class="kpi-grid">
          <div class="kpi accent"><span>Perlu dikerjakan / revisi</span><strong>{{ summary.editor.todo }}</strong></div>
          <div class="kpi"><span>Menunggu quality check</span><strong>{{ summary.editor.in_qc }}</strong></div>
          <div class="kpi"><span>Menunggu konfirmasi pelanggan</span><strong>{{ summary.editor.delivered }}</strong></div>
          <div class="kpi"><span>Selesai</span><strong>{{ summary.editor.done }}</strong></div>
        </div>
        <h2 class="mt-2">Tugas aktif</h2>
        <OrderTable v-if="orders.length" :orders="orders" show-customer />
        <EmptyState v-else icon="check" title="Tidak ada tugas aktif" text="Tugas baru akan muncul setelah admin memverifikasi pembayaran." />
      </template>
    </template>
  </DashShell>`,
};

export const Orders = {
  components: { DashShell, OrderTable },
  data: () => ({ orders: [], q: "", loading: true }),
  computed: {
    role() { return store.user.role; },
    status() { return this.$route.query.status || ""; },
    tabs() {
      const base = [{ key: "", label: "Semua" }, { key: "active", label: "Aktif" }];
      const byRole = {
        customer: [["MENUNGGU_PEMBAYARAN", "Belum dibayar"], ["DIKIRIM", "Hasil dikirim"], ["SELESAI", "Selesai"]],
        admin: [["MENUNGGU_REVIEW", "Review"], ["VERIFIKASI_PEMBAYARAN", "Verifikasi bayar"], ["QUALITY_CHECK", "Quality check"],
                ["DIKERJAKAN,REVISI", "Dikerjakan"], ["SELESAI", "Selesai"]],
        editor: [["DIKERJAKAN,REVISI", "Perlu dikerjakan"], ["QUALITY_CHECK", "Di QC"], ["SELESAI", "Selesai"]],
      };
      return base.concat(byRole[this.role].map(([key, label]) => ({ key, label })));
    },
  },
  watch: { "$route.query.status"() { this.load(); } },
  created() { this.load(); },
  methods: {
    async load() {
      this.loading = true;
      const params = new URLSearchParams({ status: this.status, q: this.q });
      this.orders = (await api("/api/orders?" + params)).orders;
      this.loading = false;
    },
  },
  template: `
  <DashShell>
    <div class="page-title">
      <h1>{{ role === 'editor' ? 'Tugas Saya' : 'Pesanan' }}</h1>
      <router-link v-if="role === 'customer'" to="/pesan" class="btn btn-accent">+ Pesan Layanan</router-link>
    </div>
    <div class="toolbar">
      <div class="tabs">
        <router-link v-for="t in tabs" :key="t.key" :to="{ query: t.key ? { status: t.key } : {} }"
          class="tab" :class="{ active: status === t.key }">{{ t.label }}</router-link>
      </div>
      <form class="search" @submit.prevent="load"><Icon name="search" :size="16" /><input v-model="q" placeholder="Cari kode, judul, pelanggan…" /></form>
    </div>
    <p v-if="loading" class="muted">Memuat…</p>
    <OrderTable v-else-if="orders.length" :orders="orders" :show-customer="role !== 'customer'" />
    <EmptyState v-else title="Tidak ada pesanan" text="Belum ada pesanan pada filter ini." />
  </DashShell>`,
};
