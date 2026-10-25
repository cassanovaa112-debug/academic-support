import { api, notify, rupiah, store, waLink } from "../api.js";

const PROCESS = [
  { icon: "upload", title: "Pesan & unggah", text: "Pilih layanan, isi detail kebutuhan, dan unggah dokumen Anda." },
  { icon: "search", title: "Review admin", text: "Admin memeriksa kebutuhan dan mengonfirmasi harga final." },
  { icon: "wallet", title: "Pembayaran", text: "Bayar via transfer/e-wallet, lalu unggah bukti pembayaran." },
  { icon: "pen", title: "Dikerjakan editor", text: "Editor mengerjakan editing, proofreading, atau formatting." },
  { icon: "shield", title: "Quality check", text: "Admin mengecek kualitas hasil sebelum dikirim ke Anda." },
  { icon: "check", title: "Terima & revisi", text: "Unduh hasil. Belum sesuai? Ajukan revisi gratis hingga 2x." },
];

const FAQ = [
  { q: "Apakah Academic Support Service mengerjakan tugas saya?",
    a: "Tidak. Kami membantu merapikan bahasa, format, dan presentasi dari karya yang Anda tulis sendiri, serta mendampingi Anda memahami materi. Isi dan gagasan tetap milik Anda." },
  { q: "Berapa lama pengerjaannya?",
    a: "Umumnya 2–3 hari tergantung layanan. Jika deadline Anda lebih cepat dari waktu normal, pesanan otomatis masuk layanan ekspres (+50%)." },
  { q: "Bagaimana jika hasilnya belum sesuai?",
    a: "Setiap pesanan mendapat revisi gratis hingga 2 kali. Ajukan revisi langsung dari halaman pesanan dengan menjelaskan bagian yang perlu diperbaiki." },
  { q: "Apakah dokumen saya aman?",
    a: "Dokumen hanya dapat diakses oleh Anda, admin, dan editor yang ditugaskan. Kami tidak membagikan dokumen pelanggan kepada pihak lain." },
  { q: "Metode pembayaran apa saja yang tersedia?",
    a: "Transfer bank, QRIS, dan e-wallet (DANA, OVO, GoPay, ShopeePay). Pembayaran dilakukan setelah admin mengonfirmasi harga." },
];

export const Home = {
  data: () => ({ services: [], testimonials: [], stats: null, process: PROCESS, faq: FAQ, store }),
  async created() {
    const [s, t] = await Promise.all([api("/api/services"), api("/api/testimonials")]);
    this.services = s.services;
    this.testimonials = t.testimonials;
    this.stats = t.stats;
  },
  methods: { rupiah, waLink },
  template: `
  <div>
    <section class="hero">
      <div class="container hero-grid">
        <div>
          <span class="eyebrow"><Icon name="grad" :size="16" /> Layanan akademik untuk mahasiswa</span>
          <h1>Tugas rapi, bahasa jelas, presentasi lebih percaya diri.</h1>
          <p class="lead">Academic Support Service membantu mahasiswa melalui editing & proofreading, formatting dokumen,
            dukungan presentasi, dan tutoring — cepat, terjangkau, dan tetap menjaga integritas akademik.</p>
          <div class="hero-cta">
            <router-link to="/pesan" class="btn btn-accent btn-lg">Pesan Sekarang <Icon name="arrow" :size="18" /></router-link>
            <a :href="waLink()" target="_blank" rel="noopener" class="btn btn-ghost-light btn-lg"><Icon name="chat" :size="18" /> Konsultasi Gratis</a>
          </div>
          <ul class="hero-points">
            <li><Icon name="check" :size="16" /> Mulai Rp15.000</li>
            <li><Icon name="check" :size="16" /> Revisi gratis 2x</li>
            <li><Icon name="check" :size="16" /> Pantau status online</li>
          </ul>
        </div>
        <div class="hero-visual" aria-hidden="true">
          <div class="mock-card">
            <div class="mock-head">
              <div><small>ASS-260928-0012</small><strong>Makalah Ekonomi Digital</strong></div>
              <span class="badge badge-progress">Quality Check</span>
            </div>
            <OrderStepper status="QUALITY_CHECK" />
            <div class="mock-row"><Icon name="doc" :size="18" /> makalah_final.docx <span>12 hlm</span></div>
            <div class="mock-row"><Icon name="pen" :size="18" /> 47 koreksi ejaan & tata bahasa</div>
            <div class="mock-row"><Icon name="layout" :size="18" /> Format APA 7th diterapkan</div>
          </div>
          <div class="mock-float"><Icon name="shield" :size="16" /> Lolos quality check</div>
        </div>
      </div>
    </section>

    <section class="stats-band">
      <div class="container stats-grid">
        <div v-if="stats && stats.completed"><strong>{{ stats.completed }}</strong><span>pesanan selesai</span></div>
        <div v-else><strong>{{ services.length || 5 }}</strong><span>jenis layanan</span></div>
        <div v-if="stats && stats.avg_rating"><strong>{{ stats.avg_rating }}/5</strong><span>rata-rata rating</span></div>
        <div v-else><strong>Rp15rb</strong><span>harga mulai</span></div>
        <div><strong>≤ 6 jam</strong><span>waktu respons admin</span></div>
        <div><strong>2x</strong><span>revisi gratis</span></div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-head">
          <span class="eyebrow dark">Layanan kami</span>
          <h2>Satu tempat untuk kebutuhan akademik rutin Anda</h2>
          <p class="muted">Harga ramah kantong mahasiswa, dihitung transparan per halaman, slide, atau sesi.</p>
        </div>
        <div class="grid-3">
          <ServiceCard v-for="s in services" :key="s.id" :service="s" compact />
        </div>
        <div class="center mt-2"><router-link to="/layanan" class="btn btn-outline">Lihat detail & simulasi harga</router-link></div>
      </div>
    </section>

    <section class="section alt">
      <div class="container">
        <div class="section-head">
          <span class="eyebrow dark">Cara kerja</span>
          <h2>Dari unggah dokumen sampai hasil final</h2>
          <p class="muted">Setiap tahap tercatat dan bisa Anda pantau langsung dari dashboard.</p>
        </div>
        <ol class="process">
          <li v-for="(p, i) in process" :key="p.title">
            <span class="process-num">{{ i + 1 }}</span>
            <Icon :name="p.icon" :size="22" />
            <h3>{{ p.title }}</h3>
            <p class="muted">{{ p.text }}</p>
          </li>
        </ol>
      </div>
    </section>

    <section class="section">
      <div class="container why-grid">
        <div>
          <span class="eyebrow dark">Kenapa kami</span>
          <h2>Dibangun oleh mahasiswa, untuk mahasiswa</h2>
          <p class="muted">Kami paham ritme perkuliahan: deadline mepet, pedoman format yang berbeda-beda, dan presentasi mendadak.
            Karena itu layanan kami dirancang cepat, jelas, dan terjangkau.</p>
          <router-link to="/tentang" class="btn btn-outline mt-1">Kenali tim kami</router-link>
        </div>
        <div class="why-list">
          <div class="why-item"><Icon name="shield" /><div><h3>Menjaga integritas akademik</h3><p class="muted">Kami memperbaiki bahasa & format, bukan menulis tugas untuk Anda.</p></div></div>
          <div class="why-item"><Icon name="wallet" /><div><h3>Harga transparan</h3><p class="muted">Estimasi harga langsung terlihat saat memesan. Tanpa biaya tersembunyi.</p></div></div>
          <div class="why-item"><Icon name="clock" /><div><h3>Tepat waktu</h3><p class="muted">Status pesanan dapat dipantau real-time, dari review hingga selesai.</p></div></div>
          <div class="why-item"><Icon name="doc" /><div><h3>Dokumen terjaga</h3><p class="muted">Akses file dibatasi hanya untuk Anda dan tim yang menangani.</p></div></div>
        </div>
      </div>
    </section>

    <section class="section alt" v-if="testimonials.length">
      <div class="container">
        <div class="section-head"><span class="eyebrow dark">Testimoni</span><h2>Kata mereka</h2></div>
        <div class="grid-3">
          <blockquote class="card testimonial" v-for="(t, i) in testimonials" :key="i">
            <div class="stars">{{ '★'.repeat(t.rating) }}<span>{{ '★'.repeat(5 - t.rating) }}</span></div>
            <p>“{{ t.review }}”</p>
            <footer><strong>{{ t.name }}</strong><span class="muted small">{{ t.service }}</span></footer>
          </blockquote>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container narrow">
        <div class="section-head"><span class="eyebrow dark">FAQ</span><h2>Pertanyaan yang sering diajukan</h2></div>
        <details class="faq" v-for="f in faq" :key="f.q"><summary>{{ f.q }}</summary><p class="muted">{{ f.a }}</p></details>
      </div>
    </section>

    <section class="cta-band">
      <div class="container cta-inner">
        <div><h2>Deadline sudah dekat?</h2><p>Unggah dokumen sekarang, admin kami segera meninjau pesanan Anda.</p></div>
        <router-link to="/pesan" class="btn btn-accent btn-lg">Mulai Pesan</router-link>
      </div>
    </section>
  </div>`,
};

export const About = {
  data: () => ({
    team: [
      { name: "Felycia Padri", role: "Admin & Customer Service", initials: "FP",
        text: "Menerima pesanan, mencatat kebutuhan pelanggan, mengatur jadwal, dan memastikan kualitas hasil sebelum dikirim." },
      { name: "Bintang Pratama S", role: "Academic Editor & Tutor", initials: "BP",
        text: "Mengerjakan editing, proofreading, formatting dokumen, serta mendampingi sesi tutoring." },
      { name: "Inayah Azzahra", role: "Marketing & Web Manager", initials: "IA",
        text: "Mengelola konten, media sosial, dan website agar layanan mudah ditemukan mahasiswa." },
    ],
  }),
  template: `
  <div>
    <section class="page-hero"><div class="container">
      <span class="eyebrow">Tentang kami</span>
      <h1>Pendamping akademik mahasiswa, dari tugas harian hingga presentasi</h1>
      <p class="lead">Academic Support Service didirikan oleh mahasiswa Program Studi S1 Bisnis Digital,
        Universitas Pahlawan Tuanku Tambusai, untuk menjawab kebutuhan rutin mahasiswa selama perkuliahan.</p>
    </div></section>

    <section class="section"><div class="container grid-2">
      <div class="card pad-lg">
        <h2>Visi</h2>
        <p class="muted">Menjadi layanan pendampingan akademik pilihan mahasiswa yang terpercaya, terjangkau, dan menjunjung integritas akademik.</p>
        <h2 class="mt-2">Misi</h2>
        <ul class="checklist">
          <li><Icon name="check" :size="16" />Membantu mahasiswa menghasilkan tugas yang rapi dan berbahasa baik.</li>
          <li><Icon name="check" :size="16" />Memberikan pendampingan belajar agar mahasiswa memahami materi, bukan sekadar menyelesaikan tugas.</li>
          <li><Icon name="check" :size="16" />Menyediakan proses pemesanan yang transparan dan dapat dipantau secara online.</li>
          <li><Icon name="check" :size="16" />Menjaga kerahasiaan dokumen dan data pelanggan.</li>
        </ul>
      </div>
      <div class="card pad-lg integrity">
        <h2><Icon name="shield" /> Komitmen integritas akademik</h2>
        <div class="grid-2 tight">
          <div><h3 class="ok">Yang kami lakukan</h3>
            <ul class="plain"><li>Koreksi ejaan & tata bahasa</li><li>Merapikan format & sitasi</li><li>Menata slide dari materi Anda</li><li>Menjelaskan materi lewat tutoring</li></ul></div>
          <div><h3 class="no">Yang tidak kami lakukan</h3>
            <ul class="plain"><li>Menulis tugas/skripsi dari nol</li><li>Mengerjakan ujian atau kuis</li><li>Parafrase untuk mengakali plagiasi</li><li>Membuat data atau sumber fiktif</li></ul></div>
        </div>
        <p class="small muted mt-1">Pesanan yang melanggar komitmen ini akan ditolak oleh admin.</p>
      </div>
    </div></section>

    <section class="section alt"><div class="container">
      <div class="section-head"><span class="eyebrow dark">Tim kami</span><h2>Orang-orang di balik layanan</h2></div>
      <div class="grid-3">
        <div class="card team-card" v-for="m in team" :key="m.name">
          <div class="avatar">{{ m.initials }}</div>
          <h3>{{ m.name }}</h3>
          <p class="role">{{ m.role }}</p>
          <p class="muted">{{ m.text }}</p>
        </div>
      </div>
    </div></section>

    <section class="section"><div class="container grid-3">
      <div class="value"><strong>Rapi</strong><p class="muted">Setiap dokumen melewati quality check sebelum dikirim.</p></div>
      <div class="value"><strong>Responsif</strong><p class="muted">Admin membalas pesan maksimal 6 jam pada jam aktif.</p></div>
      <div class="value"><strong>Jujur</strong><p class="muted">Harga transparan dan karya tetap milik mahasiswa.</p></div>
    </div></section>
  </div>`,
};

export const Services = {
  data: () => ({ services: [], sim: { service_id: null, quantity: 10, express: false }, price: null }),
  async created() {
    this.services = (await api("/api/services")).services;
    if (this.services.length) this.sim.service_id = this.services[0].id;
    this.quote();
  },
  computed: {
    selected() { return this.services.find((s) => s.id === this.sim.service_id); },
  },
  watch: { sim: { deep: true, handler() { this.quote(); } } },
  methods: {
    rupiah,
    async quote() {
      if (!this.sim.service_id || this.sim.quantity < 1) return (this.price = null);
      const q = new URLSearchParams({ service_id: this.sim.service_id, quantity: this.sim.quantity, express: this.sim.express ? 1 : 0 });
      this.price = (await api("/api/quote?" + q)).price;
    },
  },
  template: `
  <div>
    <section class="page-hero"><div class="container">
      <span class="eyebrow">Layanan & harga</span>
      <h1>Pilih bantuan yang Anda butuhkan</h1>
      <p class="lead">Semua harga sudah termasuk revisi gratis 2x. Harga final dikonfirmasi admin setelah dokumen ditinjau.</p>
    </div></section>

    <section class="section"><div class="container">
      <div class="grid-3"><ServiceCard v-for="s in services" :key="s.id" :service="s" /></div>
    </div></section>

    <section class="section alt"><div class="container grid-2 align-center">
      <div>
        <span class="eyebrow dark">Simulasi harga</span>
        <h2>Hitung estimasi biaya</h2>
        <p class="muted">Harga dasar sudah mencakup jumlah halaman/slide tertentu. Kelebihannya dihitung per unit.
          Deadline lebih cepat dari waktu pengerjaan normal dikenakan biaya ekspres +50%.</p>
      </div>
      <div class="card pad-lg">
        <label class="field"><span>Layanan</span>
          <select v-model.number="sim.service_id"><option v-for="s in services" :value="s.id" :key="s.id">{{ s.name }}</option></select>
        </label>
        <label class="field"><span>Jumlah {{ selected ? selected.unit_label : '' }}</span>
          <input type="number" min="1" max="500" v-model.number="sim.quantity" />
        </label>
        <label class="check"><input type="checkbox" v-model="sim.express" /> Layanan ekspres (≤ 24 jam, +50%)</label>
        <div class="sim-total"><span>Estimasi biaya</span><strong>{{ price !== null ? rupiah(price) : '–' }}</strong></div>
        <router-link :to="{ path: '/pesan', query: { layanan: sim.service_id, jumlah: sim.quantity } }" class="btn btn-primary btn-block">Pesan dengan estimasi ini</router-link>
      </div>
    </div></section>

    <section class="section"><div class="container narrow">
      <h2>Ketentuan layanan</h2>
      <ul class="checklist">
        <li><Icon name="check" :size="16" />Pembayaran dilakukan setelah admin mengonfirmasi harga final.</li>
        <li><Icon name="check" :size="16" />Revisi gratis maksimal 2 kali untuk ruang lingkup pesanan yang sama.</li>
        <li><Icon name="check" :size="16" />Format file yang diterima: DOC, DOCX, PDF, PPT, PPTX, ODT, TXT (maks. 20 MB).</li>
        <li><Icon name="check" :size="16" />Pesanan dapat dibatalkan tanpa biaya sebelum pembayaran.</li>
        <li><Icon name="check" :size="16" />Kami tidak menerima permintaan menulis tugas dari nol, joki ujian, atau manipulasi plagiasi.</li>
      </ul>
    </div></section>
  </div>`,
};

export const Contact = {
  data: () => ({ form: { name: "", email: "", phone: "", subject: "", message: "" }, sending: false, sent: false }),
  created() {
    if (store.user) Object.assign(this.form, { name: store.user.name, email: store.user.email, phone: store.user.phone || "" });
  },
  methods: {
    waLink,
    async submit() {
      this.sending = true;
      try {
        await api("/api/contact", { method: "POST", body: this.form });
        this.sent = true;
        notify("Pesan terkirim. Kami akan segera membalas.");
      } catch (e) { notify(e.message, "error"); }
      this.sending = false;
    },
  },
  template: `
  <div>
    <section class="page-hero"><div class="container">
      <span class="eyebrow">Kontak</span>
      <h1>Ada pertanyaan? Hubungi kami</h1>
      <p class="lead">Konsultasi gratis sebelum memesan. Admin aktif setiap hari pukul 08.00–21.00 WIB.</p>
    </div></section>
    <section class="section"><div class="container grid-2">
      <div class="contact-info">
        <a class="card contact-item" :href="waLink()" target="_blank" rel="noopener"><Icon name="chat" /><div><strong>WhatsApp (kanal resmi)</strong><span class="muted">0812-0000-0001 · balasan ≤ 6 jam</span></div></a>
        <div class="card contact-item"><Icon name="mail" /><div><strong>Email</strong><span class="muted">halo@academicsupport.id</span></div></div>
        <div class="card contact-item"><Icon name="pin" /><div><strong>Lokasi</strong><span class="muted">Bangkinang, Kabupaten Kampar, Riau<br>(sekitar Universitas Pahlawan Tuanku Tambusai)</span></div></div>
        <div class="card contact-item"><Icon name="clock" /><div><strong>Jam operasional</strong><span class="muted">Senin–Minggu, 08.00–21.00 WIB</span></div></div>
      </div>
      <div class="card pad-lg">
        <div v-if="sent" class="empty"><Icon name="check" :size="36" /><h3>Terima kasih!</h3><p class="muted">Pesan Anda sudah kami terima.</p>
          <button class="btn btn-outline" @click="sent = false; form.message = ''">Kirim pesan lain</button></div>
        <form v-else @submit.prevent="submit">
          <h2>Kirim pesan</h2>
          <label class="field"><span>Nama</span><input v-model="form.name" required /></label>
          <div class="grid-2 tight">
            <label class="field"><span>Email</span><input type="email" v-model="form.email" /></label>
            <label class="field"><span>No. WhatsApp</span><input v-model="form.phone" /></label>
          </div>
          <label class="field"><span>Subjek</span><input v-model="form.subject" placeholder="Contoh: Tanya formatting skripsi" /></label>
          <label class="field"><span>Pesan</span><textarea v-model="form.message" rows="5" required></textarea></label>
          <button class="btn btn-primary btn-block" :disabled="sending">{{ sending ? 'Mengirim…' : 'Kirim Pesan' }}</button>
        </form>
      </div>
    </div></section>
  </div>`,
};
