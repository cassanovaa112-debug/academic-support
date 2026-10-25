import { api, formatDate, formatSize, notify, ROLE_LABELS, rupiah, store } from "../api.js";
import { DashShell } from "./dashboard.js";

const FILE_KINDS = {
  source: "Dokumen pelanggan", attachment: "Lampiran revisi", payment: "Bukti pembayaran",
  result: "Hasil pekerjaan", rejected: "Draf (dikembalikan QC)",
};

// Petunjuk langkah berikutnya untuk setiap peran pada setiap status
const NEXT_STEP = {
  customer: {
    MENUNGGU_REVIEW: "Admin sedang meninjau pesanan Anda. Harga final akan dikonfirmasi segera.",
    MENUNGGU_PEMBAYARAN: "Silakan lakukan pembayaran lalu unggah bukti pembayaran di bawah.",
    VERIFIKASI_PEMBAYARAN: "Bukti pembayaran Anda sedang diverifikasi admin.",
    DIKERJAKAN: "Editor sedang mengerjakan pesanan Anda.",
    QUALITY_CHECK: "Hasil pekerjaan sedang melalui quality check sebelum dikirim.",
    DIKIRIM: "Hasil sudah siap! Unduh dan periksa, lalu terima pesanan atau ajukan revisi.",
    REVISI: "Editor sedang mengerjakan revisi sesuai permintaan Anda.",
    SELESAI: "Pesanan selesai. Terima kasih telah menggunakan layanan kami!",
  },
  admin: {
    MENUNGGU_REVIEW: "Tinjau dokumen & kebutuhan, lalu setujui (dengan harga final) atau tolak pesanan.",
    MENUNGGU_PEMBAYARAN: "Menunggu pelanggan membayar dan mengunggah bukti.",
    VERIFIKASI_PEMBAYARAN: "Periksa bukti pembayaran, lalu tunjuk editor untuk mulai mengerjakan.",
    DIKERJAKAN: "Editor sedang mengerjakan pesanan.",
    QUALITY_CHECK: "Periksa hasil editor. Loloskan untuk dikirim ke pelanggan, atau kembalikan dengan catatan.",
    DIKIRIM: "Menunggu pelanggan menerima hasil atau mengajukan revisi.",
    REVISI: "Editor sedang mengerjakan revisi pelanggan.",
  },
  editor: {
    DIKERJAKAN: "Unduh dokumen pelanggan, kerjakan, lalu unggah hasilnya untuk quality check.",
    REVISI: "Pelanggan/admin meminta perbaikan. Baca catatan di riwayat, lalu unggah hasil revisi.",
    QUALITY_CHECK: "Hasil Anda sedang diperiksa admin.",
    DIKIRIM: "Hasil sudah dikirim ke pelanggan.",
    SELESAI: "Pesanan selesai.",
  },
};

const PAYMENT_INFO = [
  { name: "Bank BRI", account: "1234-01-000000-50-1", holder: "Academic Support Service" },
  { name: "DANA / OVO / GoPay", account: "0812-0000-0001", holder: "Felycia Padri" },
];

export const OrderDetail = {
  components: { DashShell },
  data: () => ({
    order: null, editors: [], busy: false, error: "",
    f: { price: "", message: "", editor_id: "", payment_method: "", rating: 5, review: "", show_testimonial: true, internal: false },
    file: null, files: [], comment: "", mode: "", fileKey: 0,
    paymentInfo: PAYMENT_INFO, store,
  }),
  computed: {
    role() { return store.user.role; },
    actions() { return this.order?.actions || []; },
    can() { return (a) => this.actions.includes(a); },
    nextStep() { return NEXT_STEP[this.role]?.[this.order.status]; },
    groupedFiles() {
      const groups = {};
      for (const file of this.order.files) (groups[file.kind] ||= []).push(file);
      return groups;
    },
    closed() { return ["DIBATALKAN", "DITOLAK"].includes(this.order.status); },
  },
  async created() {
    // editor dimuat lebih dulu agar pilihan default editor tersedia saat pesanan dirender
    if (this.role === "admin") this.editors = (await api("/api/admin/editors")).editors;
    await this.load();
  },
  watch: { "$route.params.id"() { this.load(); } },
  methods: {
    rupiah, formatDate, formatSize,
    kindLabel: (k) => FILE_KINDS[k] || k,
    roleLabel: (r) => ROLE_LABELS[r] || r,
    async load() {
      try {
        const { order } = await api("/api/orders/" + this.$route.params.id);
        this.setOrder(order);
      } catch (e) { this.error = e.message; }
    },
    setOrder(order) {
      this.order = order;
      this.f.price = order.price;
      this.f.editor_id = order.editor?.id || this.editors[0]?.id || "";
      this.f.message = "";
      this.mode = "";
      this.file = null; this.files = []; this.fileKey++;
    },
    async run(action, fields = [], confirmText) {
      if (confirmText && !confirm(confirmText)) return;
      const fd = new FormData();
      fd.append("action", action);
      fields.forEach((k) => fd.append(k, String(this.f[k] ?? "")));
      if (this.file) fd.append("file", this.file);
      this.files.forEach((x) => fd.append("files", x));
      this.busy = true;
      try {
        const { order } = await api(`/api/orders/${this.order.id}/action`, { method: "POST", form: fd });
        this.setOrder(order);
        notify("Status pesanan diperbarui: " + order.status_label);
      } catch (e) { notify(e.message, "error"); }
      this.busy = false;
    },
    async sendComment() {
      if (!this.comment.trim()) return;
      try {
        const { order } = await api(`/api/orders/${this.order.id}/comments`, {
          method: "POST", body: { message: this.comment, internal: this.f.internal } });
        this.order = order;
        this.comment = "";
      } catch (e) { notify(e.message, "error"); }
    },
  },
  template: `
  <DashShell>
    <p v-if="error" class="alert alert-error">{{ error }}</p>
    <p v-else-if="!order" class="muted">Memuat…</p>
    <template v-else>
      <router-link to="/pesanan" class="small back">← Kembali ke daftar</router-link>
      <div class="page-title">
        <div><span class="mono muted">{{ order.code }}</span><h1>{{ order.title }}</h1>
          <p class="muted">{{ order.service.name }} · {{ order.quantity }} {{ order.service.unit_label }}<span v-if="order.express" class="tag">Ekspres</span></p></div>
        <StatusBadge :status="order.status" />
      </div>

      <div class="card pad"><OrderStepper :status="order.status" />
        <p v-if="closed" class="alert alert-error">Pesanan {{ order.status_label.toLowerCase() }}.<span v-if="order.admin_note"> Catatan: {{ order.admin_note }}</span></p>
        <p v-else-if="nextStep" class="next-step"><Icon name="arrow" :size="16" /> {{ nextStep }}</p>
      </div>

      <div class="detail-grid">
        <div class="detail-main">
          <!-- ============ PANEL AKSI ============ -->
          <section class="card pad action-panel" v-if="actions.length">
            <h2>Tindakan</h2>

            <!-- Pelanggan: pembayaran -->
            <div v-if="can('upload_payment')" class="action-block">
              <h3>Pembayaran — {{ rupiah(order.price) }}</h3>
              <p v-if="order.admin_note" class="small muted">Catatan admin: {{ order.admin_note }}</p>
              <div class="pay-grid"><div v-for="p in paymentInfo" :key="p.name" class="pay-card"><span class="small muted">{{ p.name }}</span><strong class="mono">{{ p.account }}</strong><span class="small">a.n. {{ p.holder }}</span></div></div>
              <div class="grid-2 tight">
                <label class="field"><span>Metode pembayaran</span>
                  <select v-model="f.payment_method"><option disabled value="">Pilih…</option><option v-for="m in store.meta.payment_methods" :key="m">{{ m }}</option></select></label>
                <label class="field"><span>Bukti pembayaran (JPG/PNG/PDF)</span>
                  <input type="file" :key="fileKey" accept=".jpg,.jpeg,.png,.webp,.pdf" @change="file = $event.target.files[0]" /></label>
              </div>
              <button class="btn btn-accent" :disabled="busy" @click="run('upload_payment', ['payment_method'])">Kirim Bukti Pembayaran</button>
            </div>

            <!-- Pelanggan: terima / revisi -->
            <div v-if="can('accept')" class="action-block">
              <div class="seg"><button :class="{ on: mode !== 'revisi' }" @click="mode = ''">Terima hasil</button>
                <button v-if="can('request_revision')" :class="{ on: mode === 'revisi' }" @click="mode = 'revisi'">Ajukan revisi ({{ order.max_revisions - order.revision_count }} tersisa)</button></div>
              <template v-if="mode !== 'revisi'">
                <label class="field"><span>Rating</span>
                  <div class="rating"><button type="button" v-for="n in 5" :key="n" :class="{ on: n <= f.rating }" @click="f.rating = n" :aria-label="n + ' bintang'">★</button></div></label>
                <label class="field"><span>Ulasan (opsional)</span><textarea v-model="f.review" rows="3" placeholder="Bagaimana pengalaman Anda?"></textarea></label>
                <label class="check"><input type="checkbox" v-model="f.show_testimonial" /> Izinkan ulasan ditampilkan di website (nama disingkat)</label>
                <button class="btn btn-primary" :disabled="busy" @click="run('accept', ['rating', 'review', 'show_testimonial'], 'Terima hasil dan selesaikan pesanan?')">Terima & Selesaikan</button>
              </template>
              <template v-else>
                <label class="field"><span>Bagian yang perlu direvisi</span><textarea v-model="f.message" rows="4" placeholder="Contoh: halaman 5 paragraf 2 masih ada typo; format daftar pustaka belum APA."></textarea></label>
                <label class="field"><span>Lampiran (opsional)</span><input type="file" :key="fileKey" @change="file = $event.target.files[0]" /></label>
                <button class="btn btn-accent" :disabled="busy" @click="run('request_revision', ['message'])">Kirim Permintaan Revisi</button>
              </template>
            </div>

            <!-- Admin: review pesanan -->
            <div v-if="can('approve')" class="action-block">
              <div class="grid-2 tight">
                <label class="field"><span>Harga final (Rp)</span><input type="number" min="1" v-model="f.price" /></label>
              </div>
              <label class="field"><span>Catatan untuk pelanggan / alasan penolakan</span><textarea v-model="f.message" rows="3"></textarea></label>
              <div class="btn-row">
                <button class="btn btn-primary" :disabled="busy" @click="run('approve', ['price', 'message'])">Setujui & Minta Pembayaran</button>
                <button class="btn btn-danger-outline" :disabled="busy" @click="run('reject', ['message'], 'Tolak pesanan ini?')">Tolak Pesanan</button>
              </div>
            </div>

            <!-- Admin: verifikasi pembayaran -->
            <div v-if="can('verify_payment')" class="action-block">
              <p class="small">Metode: <strong>{{ order.payment_method }}</strong> · Nominal tagihan: <strong>{{ rupiah(order.price) }}</strong>.
                Periksa bukti pembayaran pada daftar file.</p>
              <label class="field"><span>Tunjuk editor</span>
                <select v-model="f.editor_id"><option v-for="e in editors" :key="e.id" :value="e.id">{{ e.name }}</option></select></label>
              <label class="field"><span>Alasan jika bukti ditolak</span><input v-model="f.message" placeholder="Contoh: nominal tidak sesuai" /></label>
              <div class="btn-row">
                <button class="btn btn-primary" :disabled="busy" @click="run('verify_payment', ['editor_id'])">Verifikasi & Mulai Kerjakan</button>
                <button class="btn btn-danger-outline" :disabled="busy" @click="run('reject_payment', ['message'])">Tolak Bukti</button>
              </div>
            </div>

            <!-- Editor: unggah hasil -->
            <div v-if="can('submit_result')" class="action-block">
              <h3>{{ order.status === 'REVISI' ? 'Unggah hasil revisi' : 'Unggah hasil pekerjaan' }}</h3>
              <label class="field"><span>File hasil (DOCX/PDF/PPTX)</span><input type="file" multiple :key="fileKey" @change="files = Array.from($event.target.files)" /></label>
              <label class="field"><span>Catatan untuk admin/pelanggan</span><textarea v-model="f.message" rows="3" placeholder="Ringkasan perubahan yang dilakukan"></textarea></label>
              <button class="btn btn-accent" :disabled="busy" @click="run('submit_result', ['message'])">Kirim ke Quality Check</button>
            </div>

            <!-- Admin: quality check -->
            <div v-if="can('qc_approve')" class="action-block">
              <p class="small">Unduh dan periksa file <strong>Hasil pekerjaan</strong> terbaru sebelum mengirim ke pelanggan.</p>
              <label class="field"><span>Catatan (untuk pelanggan jika lolos / untuk editor jika dikembalikan)</span><textarea v-model="f.message" rows="3"></textarea></label>
              <div class="btn-row">
                <button class="btn btn-primary" :disabled="busy" @click="run('qc_approve', ['message'])">Lolos QC & Kirim ke Pelanggan</button>
                <button class="btn btn-danger-outline" :disabled="busy" @click="run('qc_return', ['message'])">Kembalikan ke Editor</button>
              </div>
            </div>

            <!-- Admin: ganti editor -->
            <div v-if="can('assign_editor')" class="action-block inline">
              <label class="field"><span>Editor yang menangani</span>
                <select v-model="f.editor_id"><option v-for="e in editors" :key="e.id" :value="e.id">{{ e.name }}</option></select></label>
              <button class="btn btn-outline" :disabled="busy || f.editor_id === order.editor?.id" @click="run('assign_editor', ['editor_id'])">Ganti Editor</button>
            </div>

            <!-- Pelanggan: batal -->
            <div v-if="can('cancel')" class="action-block muted-block">
              <button class="btn btn-link text-danger" :disabled="busy" @click="run('cancel', [], 'Batalkan pesanan ini?')">Batalkan pesanan</button>
            </div>
          </section>

          <!-- ============ FILE ============ -->
          <section class="card pad">
            <h2>File</h2>
            <p v-if="!order.files.length" class="muted small">Belum ada file.</p>
            <div v-for="(list, kind) in groupedFiles" :key="kind" class="file-group">
              <h3 class="small muted">{{ kindLabel(kind) }}</h3>
              <a v-for="file in list" :key="file.id" :href="file.url" class="file-row" :class="{ result: kind === 'result' }">
                <Icon name="doc" :size="18" /><span class="file-name">{{ file.name }}</span>
                <span class="small muted">{{ formatSize(file.size) }} · {{ formatDate(file.created_at, true) }}</span>
                <Icon name="download" :size="18" />
              </a>
            </div>
          </section>

          <!-- ============ RIWAYAT & DISKUSI ============ -->
          <section class="card pad">
            <h2>Riwayat & diskusi</h2>
            <ol class="timeline">
              <li v-for="log in order.logs" :key="log.id" :class="[log.kind, { internal: log.internal }]">
                <div class="tl-head"><strong>{{ log.actor ? log.actor.name : 'Sistem' }}</strong>
                  <span class="small muted" v-if="log.actor">{{ roleLabel(log.actor.role) }}</span>
                  <span v-if="log.internal" class="tag">internal</span>
                  <span class="small muted tl-time">{{ formatDate(log.created_at, true) }}</span></div>
                <p>{{ log.message }}</p>
              </li>
            </ol>
            <form class="comment-box" @submit.prevent="sendComment" v-if="!closed">
              <textarea v-model="comment" rows="2" placeholder="Tulis pesan terkait pesanan ini…"></textarea>
              <div class="btn-row">
                <label v-if="role !== 'customer'" class="check small"><input type="checkbox" v-model="f.internal" /> Catatan internal (tidak terlihat pelanggan)</label>
                <button class="btn btn-primary btn-sm">Kirim</button>
              </div>
            </form>
          </section>
        </div>

        <!-- ============ DETAIL ============ -->
        <aside class="card pad detail-side">
          <h2>Detail pesanan</h2>
          <dl class="econ">
            <dt>Dibuat</dt><dd>{{ formatDate(order.created_at, true) }}</dd>
            <dt>Deadline</dt><dd>{{ formatDate(order.deadline) }}</dd>
            <dt v-if="order.course">Mata kuliah</dt><dd v-if="order.course">{{ order.course }}</dd>
            <dt v-if="order.citation_style">Gaya sitasi</dt><dd v-if="order.citation_style">{{ order.citation_style }}</dd>
            <dt>Bahasa</dt><dd>{{ order.language }}</dd>
            <dt>Revisi</dt><dd>{{ order.revision_count }} / {{ order.max_revisions }}</dd>
            <dt>Editor</dt><dd>{{ order.editor ? order.editor.name : '-' }}</dd>
            <dt v-if="order.payment_method">Pembayaran</dt><dd v-if="order.payment_method">{{ order.payment_method }}<span v-if="order.paid_at" class="small muted"> · lunas</span></dd>
            <dt class="total">Biaya</dt><dd class="total">{{ rupiah(order.price) }}</dd>
          </dl>
          <div v-if="order.notes" class="notes"><h3 class="small muted">Catatan pelanggan</h3><p>{{ order.notes }}</p></div>
          <div v-if="role === 'admin'" class="notes"><h3 class="small muted">Kontak pelanggan</h3>
            <p><strong>{{ order.customer.name }}</strong><br>{{ order.customer.email }}<br>{{ order.customer.phone || '-' }}</p></div>
          <div v-if="order.rating" class="notes"><h3 class="small muted">Ulasan pelanggan</h3>
            <p class="stars">{{ '★'.repeat(order.rating) }}<span>{{ '★'.repeat(5 - order.rating) }}</span></p><p>{{ order.review }}</p></div>
        </aside>
      </div>
    </template>
  </DashShell>`,
};
