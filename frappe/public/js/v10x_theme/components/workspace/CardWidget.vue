<template>
  <div class="v10x-card h-100">
    <div class="card-header-v10x px-4 py-3 d-flex align-items-center justify-content-between">
      <h3 class="card-title-text mb-0">{{ card_data.label }}</h3>
      <div class="card-badge">{{ card_data.links?.length || 0 }}</div>
    </div>
    <div class="card-body-v10x px-2 py-2">
      <div v-for="(link, idx) in card_data.links" :key="idx" 
           class="nav-link-item" @click="navigateTo(link)">
        <div class="link-bullet"></div>
        <div class="link-info">
          <div class="link-label">{{ link.label || link.link_to }}</div>
        </div>
        <div class="link-arrow">
          <i class="mdi mdi-chevron-right"></i>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
    name: 'CardWidget',
    props: {
        card_data: {
            type: Object,
            required: true
        }
    },
    methods: {
        navigateTo(link) {
            if (link.link_type === 'doctype') {
                frappe.set_route('List', link.link_to);
            } else if (link.link_type === 'report') {
                frappe.set_route('query-report', link.link_to);
            }
        }
    }
};
</script>

<style scoped>
.v10x-card {
    background: #ffffff;
    border-radius: 16px;
    border: 1px solid #f1f5f9;
    box-shadow: 0 1px 2px rgba(0,0,0,0.03);
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.card-header-v10x {
    background: #fff;
    border-bottom: 1px solid #f8fafc;
}

.card-title-text {
    font-size: 15px;
    font-weight: 700;
    color: #1e293b;
}

.card-badge {
    background: #f1f5f9;
    color: #64748b;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 20px;
}

.nav-link-item {
    display: flex;
    align-items: center;
    padding: 10px 16px;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
    gap: 12px;
}

.nav-link-item:hover {
    background: #f8fafc;
}

.link-bullet {
    width: 6px;
    height: 6px;
    background: #cbd5e1;
    border-radius: 50%;
    transition: all 0.2s ease;
}

.nav-link-item:hover .link-bullet {
    background: var(--primary);
    transform: scale(1.2);
}

.link-label {
    font-size: 14px;
    font-weight: 500;
    color: #475569;
}

.nav-link-item:hover .link-label {
    color: #0f172a;
}

.link-arrow {
    margin-left: auto;
    color: #cbd5e1;
    font-size: 18px;
    opacity: 0;
    transition: all 0.2s ease;
}

.nav-link-item:hover .link-arrow {
    opacity: 1;
    transform: translateX(2px);
    color: var(--primary);
}
</style>
