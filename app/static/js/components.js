import { store, rupiah } from "./api.js";

const ICONS = {
  doc: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
  pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  layout: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
  slides: '<rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  wallet: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M16 15h2"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  arrow: '<path d="M5 12h14M12 5l7 7-7 7"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
  pin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  grad: '<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 16v-4M12 16V8M17 16v-7"/>',
  inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.1z"/>',
};

export const Icon = {
  props: { name: String, size: { type: Number, default: 20 } },
  computed: { svg() { return ICONS[this.name] || ICONS.doc; } },
  template: `<svg class="icon" :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" v-html="svg"></svg>`,
};

const STATUS_TONES = {
  MENUNGGU_REVIEW: "warn", MENUNGGU_PEMBAYARAN: "warn", VERIFIKASI_PEMBAYARAN: "info",
  DIKERJAKAN: "progress", QUALITY_CHECK: "progress", REVISI: "progress",
  DIKIRIM: "info", SELESAI: "success", DIBATALKAN: "muted", DITOLAK: "danger",
};

export const StatusBadge = {
  props: { status: String },
  computed: {
    label() { return store.meta.status_labels[this.status] || this.status; },
    tone() { return STATUS_TONES[this.status] || "muted"; },
  },
  template: `<span class="badge" :class="'badge-' + tone">{{ label }}</span>`,
};

const STEPS = [
  { key: "MENUNGGU_REVIEW", label: "Review" },
  { key: "MENUNGGU_PEMBAYARAN", label: "Pembayaran" },
  { key: "VERIFIKASI_PEMBAYARAN", label: "Verifikasi" },
  { key: "DIKERJAKAN", label: "Dikerjakan" },
  { key: "QUALITY_CHECK", label: "Quality Check" },
  { key: "DIKIRIM", label: "Dikirim" },
  { key: "SELESAI", label: "Selesai" },
];

export const OrderStepper = {
  props: { status: String },
  computed: {
    steps() { return STEPS; },
    current() {
      const key = this.status === "REVISI" ? "DIKERJAKAN" : this.status;
      return STEPS.findIndex((s) => s.key === key);
    },
  },
  template: `
    <ol class="stepper" v-if="current >= 0">
      <li v-for="(step, i) in steps" :key="step.key"
          :class="{ done: i < current || status === 'SELESAI', active: i === current && status !== 'SELESAI' }">
        <span class="dot"><Icon v-if="i < current || status === 'SELESAI'" name="check" :size="14" /><template v-else>{{ i + 1 }}</template></span>
        <span class="step-label">{{ step.key === 'DIKERJAKAN' && status === 'REVISI' ? 'Revisi' : step.label }}</span>
      </li>
    </ol>`,
};

export const ServiceCard = {
  props: { service: Object, compact: Boolean },
  methods: { rupiah },
  template: `
    <article class="card service-card" :class="{ featured: service.featured }">
      <span v-if="service.featured" class="ribbon">Paling diminati</span>
      <div class="service-icon"><Icon :name="service.icon" :size="24" /></div>
      <h3>{{ service.name }}</h3>
      <p class="muted">{{ service.short }}</p>
      <div class="price">
        <span class="from">mulai</span>
        <strong>{{ rupiah(service.base_price) }}</strong>
        <span class="unit">/ {{ service.included_units > 1 ? 's.d. ' + service.included_units + ' ' : '' }}{{ service.unit_label }}</span>
      </div>
      <ul v-if="!compact" class="checklist">
        <li v-for="f in service.features" :key="f"><Icon name="check" :size="16" />{{ f }}</li>
      </ul>
      <p v-if="!compact" class="small muted">
        <template v-if="service.extra_unit_price">Tambahan {{ rupiah(service.extra_unit_price) }}/{{ service.unit_label }} · </template>
        Selesai ± {{ service.turnaround_days }} hari
      </p>
      <router-link :to="{ path: '/pesan', query: { layanan: service.id } }" class="btn" :class="service.featured ? 'btn-accent' : 'btn-outline'">
        Pesan Layanan
      </router-link>
    </article>`,
};

export const EmptyState = {
  props: { icon: { type: String, default: "inbox" }, title: String, text: String },
  template: `
    <div class="empty">
      <Icon :name="icon" :size="36" />
      <h3>{{ title }}</h3>
      <p class="muted" v-if="text">{{ text }}</p>
      <slot />
    </div>`,
};

export function registerComponents(app) {
  app.component("Icon", Icon);
  app.component("StatusBadge", StatusBadge);
  app.component("OrderStepper", OrderStepper);
  app.component("ServiceCard", ServiceCard);
  app.component("EmptyState", EmptyState);
}
