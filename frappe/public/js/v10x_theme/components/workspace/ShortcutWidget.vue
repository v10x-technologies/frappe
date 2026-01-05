<template>
  <div class="shortcut-group py-2">
    <div class="row g-3">
      <div v-for="(shortcut, idx) in shortcuts" :key="idx" class="col-6 col-md-4 col-lg-2">
        <div class="shortcut-card" @click="navigateTo(shortcut)">
          <div class="shortcut-icon">
            <i :class="getIcon(shortcut)"></i>
          </div>
          <div class="shortcut-content">
            <span class="shortcut-label">{{ shortcut.label || shortcut.name }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
    name: 'ShortcutWidget',
    props: {
        shortcuts: {
            type: Array,
            required: true
        }
    },
    methods: {
        getIcon(shortcut) {
            if (shortcut.icon) {
                if (shortcut.icon.startsWith('mdi-')) return `mdi ${shortcut.icon}`;
                return `mdi mdi-${shortcut.icon}`;
            }
            return 'mdi mdi-link-variant';
        },
        navigateTo(shortcut) {
            if (!shortcut.link_to) return;
            
            if (shortcut.type === 'DocType') {
                frappe.set_route('List', shortcut.link_to);
            } else if (shortcut.type === 'Report') {
                frappe.set_route('query-report', shortcut.link_to);
            } else if (shortcut.type === 'Page') {
                frappe.set_route(shortcut.link_to);
            }
        }
    }
};
</script>

<style scoped>
.shortcut-card {
    background: #ffffff;
    border: 1px solid #f1f5f9;
    border-radius: 12px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    text-align: center;
}

.shortcut-card:hover {
    border-color: var(--primary);
    transform: translateY(-4px);
    box-shadow: 0 12px 20px -10px rgba(var(--primary-rgb), 0.15);
}

.shortcut-icon {
    width: 40px;
    height: 40px;
    background: #f8fafc;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    color: #64748b;
    transition: all 0.2s ease;
}

.shortcut-card:hover .shortcut-icon {
    background: var(--primary);
    color: #ffffff;
}

.shortcut-label {
    font-size: 13px;
    font-weight: 600;
    color: #334155;
    line-height: 1.4;
}
</style>
