import { api, daysLeft, formatSize, notify, rupiah, store } from "../api.js";
import { DashShell } from "./dashboard.js";

const today = () => new Date().toISOString().slice(0, 10);

export const OrderNew = {
  components: { DashShell },
  data() {
    return {
      services: [],
      form: {
        service_id: Number(this.$route.query.layanan) || null,
        title: "", course: "", quantity: Number(this.$route.query.jumlah) || 10,
        citation_style: "APA 7th", language: "Bahasa Indonesia",
        deadline: "", express: false, notes: "", integrity_agreed: false,
      },
      files: [],
      price: null,
      submitting: false,
      error: "",
      minDate: today(),
      store,
    };
  },
  async created() {
    this.services = (await api("/api/services")).services;
    if (!this.form.service_id && this.services.length) this.form.service_id = this.services[0].id;
  },
  computed: {
    service() { return this.services.find((s) => s.id === this.form.service_id); },
    isTutoring() { return this.service?.slug === "tutoring"; },
    autoExpress() {
      return this.service && this.form.deadline && daysLeft(this.form.deadline) < this.service.turnaround_days;
    },
    express() { return this.form.express || this.autoExpress; },
  },
  watch: {
    "form.service_id"() { this.quote(); },
    "form.quantity"() { this.quote(); },
    express() { this.quote(); },
  },
  methods: {
    rupiah, formatSize,
    async quote() {
      if (!this.form.service_id || !(this.form.quantity >= 1)) return (this.price = null);
      const q = new URLSearchParams({ service_id: this.form.service_id, quantity: this.form.quantity, express: this.express ? 1 : 0 });
      this.price = (await api("/api/quote?" + q)).price;
    },
    pickFiles(e) { this.files = Array.from(e.target.files); },
    async submit() {
      this.error = "";
      if (!this.form.integrity_agreed) return (this.error = "Centang pernyataan integritas akademik terlebih dahulu.");
      if (!this.isTutoring && !this.files.length) return (this.error = "Unggah dokumen yang akan dikerjakan.");
      const fd = new FormData();
      Object.entries(this.form).forEach(([k, v]) => fd.append(k, typeof v === "boolean" ? String(v) : v ?? ""));
      this.files.forEach((f) => fd.append("files", f));
      this.submitting = true;
      try {
        const { order } = await api("/api/orders", { method: "POST", form: fd });
        notify(`Pesanan ${order.code} berhasil dibuat.`);
        this.$router.push("/pesanan/" + order.id);
      } catch (e) { this.error = e.message; }
      this.submitting = false;
    },
  },
  template: `
  <DashShell>
    <div class="page-title"><div><h1>Pesan Layanan</h1><p class="muted">Isi detail kebutuhan Anda. Admin akan meninjau dan mengonfirmasi harga final.</p></div></div>
    <form class="order-form" @submit.prevent="submit">
      <div class="order-form-main">
        <fieldset class="card pad">
          <legend>1. Pilih layanan</legend>
          <div class="service-options">
            <label v-for="s in services" :key="s.id" class="service-option" :class="{ selected: form.service_id === s.id }">
              <input type="radio" :value="s.id" v-model="form.service_id" />
              <Icon :name="s.icon" /><div><strong>{{ s.name }}</strong><span class="small muted">mulai {{ rupiah(s.base_price) }} · ± {{ s.turnaround_days }} hari</span></div>
            </label>
          </div>
        </fieldset>

        <fieldset class="card pad">
          <legend>2. Detail {{ isTutoring ? 'sesi belajar' : 'dokumen' }}</legend>
          <label class="field"><span>{{ isTutoring ? 'Topik / materi yang ingin dipelajari' : 'Judul tugas / dokumen' }}</span>
            <input v-model="form.title" required maxlength="200" :placeholder="isTutoring ? 'Contoh: Statistika — uji hipotesis' : 'Contoh: Makalah Ekonomi Digital'" /></label>
          <div class="grid-2 tight">
            <label class="field"><span>Mata kuliah (opsional)</span><input v-model="form.course" maxlength="120" /></label>
            <label class="field"><span>Jumlah {{ service ? service.unit_label : 'halaman' }}</span>
              <input type="number" min="1" max="500" v-model.number="form.quantity" required /></label>
          </div>
          <div class="grid-2 tight" v-if="!isTutoring">
            <label class="field"><span>Gaya sitasi</span>
              <select v-model="form.citation_style"><option v-for="c in store.meta.citation_styles" :key="c">{{ c }}</option></select></label>
            <label class="field"><span>Bahasa dokumen</span>
              <select v-model="form.language"><option>Bahasa Indonesia</option><option>English</option></select></label>
          </div>
          <label class="field"><span>{{ isTutoring ? 'Tanggal sesi yang diinginkan' : 'Deadline' }}</span>
            <input type="date" v-model="form.deadline" :min="minDate" required /></label>
          <label class="check"><input type="checkbox" v-model="form.express" /> Layanan ekspres (≤ 24 jam, +50%)</label>
          <p v-if="autoExpress && !form.express" class="alert alert-warn small">Deadline lebih cepat dari waktu pengerjaan normal ({{ service.turnaround_days }} hari), sehingga pesanan otomatis masuk layanan ekspres.</p>
          <label class="field"><span>Catatan untuk editor</span>
            <textarea v-model="form.notes" rows="4" :placeholder="isTutoring ? 'Jelaskan bagian materi yang belum dipahami, preferensi online/tatap muka, dll.' : 'Contoh: ikuti pedoman penulisan fakultas, fokus pada bab 2 dan daftar pustaka.'"></textarea></label>
        </fieldset>

        <fieldset class="card pad">
          <legend>3. Unggah {{ isTutoring ? 'materi (opsional)' : 'dokumen' }}</legend>
          <label class="dropzone">
            <input type="file" multiple @change="pickFiles" accept=".doc,.docx,.pdf,.ppt,.pptx,.odt,.txt,.rtf,.xls,.xlsx,.zip" />
            <Icon name="upload" :size="28" />
            <span><strong>Pilih file</strong> atau seret ke sini</span>
            <span class="small muted">DOC, DOCX, PDF, PPT, PPTX, ODT, TXT · maks. 20 MB total</span>
          </label>
          <ul class="file-list" v-if="files.length"><li v-for="f in files" :key="f.name"><Icon name="doc" :size="16" />{{ f.name }} <span class="muted small">{{ formatSize(f.size) }}</span></li></ul>
        </fieldset>
      </div>

      <aside class="order-summary card pad">
        <h2>Ringkasan</h2>
        <dl class="econ" v-if="service">
          <dt>Layanan</dt><dd>{{ service.name }}</dd>
          <dt>Jumlah</dt><dd>{{ form.quantity || 0 }} {{ service.unit_label }}</dd>
          <dt>Harga dasar</dt><dd>{{ rupiah(service.base_price) }}</dd>
          <dt v-if="form.quantity > service.included_units">Tambahan {{ form.quantity - service.included_units }} {{ service.unit_label }}</dt>
          <dd v-if="form.quantity > service.included_units">{{ rupiah((form.quantity - service.included_units) * service.extra_unit_price) }}</dd>
          <dt v-if="express">Biaya ekspres</dt><dd v-if="express">+50%</dd>
          <dt class="total">Estimasi total</dt><dd class="total">{{ price !== null ? rupiah(price) : '–' }}</dd>
        </dl>
        <label class="check integrity-check"><input type="checkbox" v-model="form.integrity_agreed" />
          <span class="small">Saya menyatakan dokumen/materi ini adalah karya saya sendiri dan layanan ini digunakan untuk perbaikan bahasa, format, atau pendampingan belajar — bukan untuk dikerjakan orang lain.</span></label>
        <p v-if="error" class="alert alert-error small">{{ error }}</p>
        <button class="btn btn-accent btn-block" :disabled="submitting">{{ submitting ? 'Mengirim…' : 'Kirim Pesanan' }}</button>
        <p class="small muted center">Belum perlu membayar sekarang. Pembayaran dilakukan setelah admin mengonfirmasi harga.</p>
      </aside>
    </form>
  </DashShell>`,
};
