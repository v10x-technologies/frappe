<template>
  <transition name="fade">
    <div class="v10x-page-header" v-show="show && hasContent">
      <div class="header-container d-flex align-items-center justify-content-between px-4 py-2">
        <div class="page-title-area d-flex flex-column align-items-start gap-1">
            <!-- Dedicated Portal for Breadcrumbs (Top Line) -->
            <div id="v10x-breadcrumbs-portal" class="d-flex align-items-center"></div>
            
            <!-- Dedicated Portal for Title (Bottom Line) -->
            <div id="v10x-title-text-portal" class="d-flex align-items-center"></div>
        </div>
          
          <div class="page-actions-area d-flex align-items-center gap-2">
              <div id="v10x-custom-actions-portal" class="d-flex align-items-center gap-2"></div>
              <div id="v10x-standard-actions-portal" class="d-flex align-items-center gap-2"></div>
          </div>
        </div>
      </div>
    </transition>
</template>

<script>
export default {
    name: 'V10xPageHeader',
    props: {
        show: {
            type: Boolean,
            default: true
        }
    },
    data() {
        return {
            hasContent: false,
            hasBreadcrumbs: false,
            hasTitle: false,
            observer: null
        }
    },
    mounted() {
        this.setupObserver();
    },
    beforeUnmount() {
        if (this.observer) this.observer.disconnect();
    },
    methods: {
        setupObserver() {
            const checkContent = () => {
                const bcPortal = document.getElementById('v10x-breadcrumbs-portal');
                const titlePortal = document.getElementById('v10x-title-text-portal');
                const standardPortal = document.getElementById('v10x-standard-actions-portal');
                
                this.hasBreadcrumbs = !!(bcPortal && bcPortal.children.length > 0);
                this.hasTitle = !!(titlePortal && titlePortal.children.length > 0);
                const hasActions = !!(standardPortal && standardPortal.children.length > 0);
                
                this.hasContent = this.hasBreadcrumbs || this.hasTitle || hasActions;
            };

            this.observer = new MutationObserver(checkContent);
            const target = this.$el; 
            // Wait, this.$el is the transition or the div.
            // We need to observe the portals inside.
            this.$nextTick(() => {
                const container = document.querySelector('.v10x-page-header');
                if (container) {
                    this.observer.observe(container, { childList: true, subtree: true });
                }
                checkContent();
            });
        }
    }
};
</script>

<style scoped>
.v10x-page-header {
    background: #fff;
    border-bottom: 1px solid var(--border-color);
    margin-bottom: 0;
    z-index: 1010; /* Increased from 100 to be above sidebar (999) and main header (1000) */
    position: sticky;
    top: 70px; /* Sits below the main V10x header */
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); /* Added slight shadow to distinguish when sticky */
    transition: top 0.3s ease, opacity 0.3s ease;
}

/* Ensure dropdowns inside the header are always on top */
:deep(.menu-btn-group), 
:deep(.actions-btn-group),
:deep(.dropdown) {
    position: relative;
    z-index: 1;
}

:deep(.dropdown-menu) {
    z-index: 1050 !important; /* Ensure it stays above most elements */
}

/* FADE TRANSITION */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.header-container {
    min-height: 60px; /* Increased slightly to accommodate two lines */
    padding: 10px 0;
}

#v10x-page-title-portal {
    font-size: 13px;
    gap: 12px;
}

.title-separator {
    color: var(--text-muted);
    opacity: 0.5;
    font-size: 14px;
    font-weight: 300;
}

/* Breadcrumb Styling */
:deep(#navbar-breadcrumbs) {
    display: flex !important;
    flex-direction: row !important;
    flex-wrap: nowrap !important;
    list-style: none !important;
    padding: 0 !important;
    margin: 0 !important;
    gap: 4px !important;
    align-items: center !important;
}

:deep(#navbar-breadcrumbs li) {
    display: flex !important;
    align-items: center !important;
    white-space: nowrap !important;
}

:deep(#navbar-breadcrumbs li::after) {
    content: '>';
    margin-left: 8px;
    color: var(--text-muted);
    font-size: 10px;
    opacity: 0.5;
}

:deep(#navbar-breadcrumbs li:last-child::after) {
    content: '>';
}

:deep(#navbar-breadcrumbs a) {
    color: var(--text-muted);
    text-decoration: none;
    font-weight: 400;
    font-size: 13px;
    transition: color 0.2s;
}

:deep(#navbar-breadcrumbs a:hover) {
    color: var(--primary);
}

/* Title Styling */
:deep(.title-area) {
    display: flex;
    align-items: center;
}

:deep(.title-text) {
    font-size: 16px;
    font-weight: 700;
    color: var(--heading-color);
    letter-spacing: -0.01em;
}

:deep(.indicator-pill) {
    margin-left: 10px;
    padding: 3px 10px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

:deep(.btn) {
    border-radius: 6px;
    font-weight: 600;
    padding: 7px 15px;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s;
}

:deep(.btn-primary) {
    background-color: var(--primary);
    border-color: var(--primary);
}

:deep(.btn-primary:hover) {
    background-color: #0086d1;
    border-color: #0086d1;
}

:deep(.btn-default), :deep(.btn-secondary) {
    background-color: #f1faff;
    border-color: #f1faff;
    color: var(--primary);
}

:deep(.btn-default:hover), :deep(.btn-secondary:hover) {
    background-color: var(--primary);
    border-color: var(--primary);
    color: #fff;
}

/* Ensure Frappe dropdown menus play nice */
:deep(.dropdown-menu) {
    border: 1px solid var(--border-color);
    box-shadow: 0 10px 40px rgba(0,0,0,0.08);
    border-radius: 10px;
    padding: 6px;
    z-index: 3001;
}

:deep(.dropdown-item) {
    border-radius: 6px;
    padding: 8px 12px;
    font-size: 13px;
    color: var(--text-color);
}

:deep(.dropdown-item:hover) {
    background-color: var(--primary-light);
    color: var(--primary);
}
</style>
