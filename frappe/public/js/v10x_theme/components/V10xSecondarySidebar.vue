<template>
    <transition name="slide-left">
        <div v-if="isOpen" 
             class="v10x-secondary-sidebar" 
             :class="{ 'is-collapsed': sidebarCollapsed }"
             @click.self="closeSidebar">
            <div class="secondary-sidebar-content">
                <div class="sidebar-header">
                    <h5>Quick Links</h5>
                    <button class="btn-reset close-btn" @click="closeSidebar">
                        <i class="mdi mdi-close"></i>
                    </button>
                </div>
                
                <div class="sidebar-body">
                    <template v-for="(item, index) in sortedMenuItems" :key="index">
                        <!-- Header Type (Handle Hader/Header typo) -->
                        <div v-if="isHeader(item)" class="menu-header">
                            {{ item.show_name }}
                        </div>
                        
                        <!-- Link Type -->
                        <a v-else 
                           class="menu-link"
                           :href="item.menu_name"
                           @click="handleLinkClick(item, $event)">
                            {{ item.show_name }}
                        </a>
                    </template>
                    
                    <div v-if="menuItems.length === 0" class="empty-state">
                        No menu items configured
                    </div>
                </div>
            </div>
        </div>
    </transition>
</template>

<script>
export default {
    name: 'V10xSecondarySidebar',
    props: {
        isOpen: {
            type: Boolean,
            default: false
        },
        workspaceName: {
            type: String,
            default: ''
        },
        sidebarCollapsed: {
            type: Boolean,
            default: false
        },
        menuItems: {
            type: Array,
            default: () => []
        },
        currentRoute: {
            type: String,
            default: ''
        }
    },
    methods: {
        closeSidebar() {
            this.$emit('close');
        },
        isHeader(item) {
            return item.type === 'Header' || item.type === 'Hader' || item.type === 'header';
        },
        handleLinkClick(item, event) {
            // If it's a relative path starting with /app, use router
            // If external, let default behavior happen
            if (item.menu_name && !item.menu_name.startsWith('http')) {
                 event.preventDefault();
                 // If it doesn't start with /, assume it's a doctype or page name
                 let route = item.menu_name.startsWith('/') ? item.menu_name : `/app/${item.menu_name}`;
                 frappe.set_route(frappe.router.slug(route));
                 // this.closeSidebar(); // Maybe keep open? User didn't specify. Standard behavior is usually keep open or close on mobile.
            }
        }
    },
    computed: {
        sortedMenuItems() {
            return [...this.menuItems]
                .filter(item => !item.status || item.status === 'Active')
                .sort((a, b) => (a.sequel || 0) - (b.sequel || 0));
        }
    }
}
</script>

<style scoped>
.v10x-secondary-sidebar {
    position: fixed;
    top: 70px; /* Match header height */
    left: 240px; /* Default expanded sidebar width */
    bottom: 0;
    width: 250px;
    z-index: 1001; /* Ensure above content */
    pointer-events: none; /* Allow clicking through empty space if we had it, but here we just position the content */
    /* display: block !important; Removed forced display */
    transition: left 0.2s ease-in-out; /* Sync with primary sidebar toggle */
}

/* Dynamic left position based on sidebar state */

.v10x-secondary-sidebar.is-collapsed {
    left: 60px;
}

:global(body.v10x-sidebar-hidden) .v10x-secondary-sidebar {
    left: 0;
} 


.secondary-sidebar-content {
    width: 100%;
    height: 100%;
    background: #fff;
    border-right: 1px solid var(--border-color);
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
    pointer-events: auto; /* Re-enable pointer events */
}

.sidebar-header {
    padding: 15px 20px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #f9fafb; /* Light gray header background */
}

.sidebar-header h5 {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: var(--heading-color);
}

.close-btn {
    font-size: 20px;
    color: var(--text-muted);
    cursor: pointer;
    background: none;
    border: none;
    padding: 0;
    line-height: 1;
}

.close-btn:hover {
    color: var(--text-color);
}

.sidebar-body {
    flex: 1;
    overflow-y: auto;
    padding: 15px;
    background-color: #fff;
}

.menu-header {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--text-muted);
    letter-spacing: 0.05em;
    padding: 10px 10px 5px;
    margin-top: 10px;
}

.menu-link {
    display: block;
    padding: 10px 12px;
    color: var(--text-color);
    font-size: 14px;
    font-weight: 500;
    text-decoration: none;
    border-radius: 6px;
    margin-bottom: 2px;
    transition: all 0.15s ease;
}

.menu-link:hover {
    background-color: #f3f4f6;
    color: var(--primary);
}

.empty-state {
    text-align: center;
    padding: 40px 20px;
    color: var(--text-muted);
    font-size: 14px;
}

/* Slide Animation */
.slide-left-enter-active, .slide-left-leave-active {
    transition: transform 0.2s ease, opacity 0.2s ease;
}

.slide-left-enter-from, .slide-left-leave-to {
    transform: translateX(-20px);
    opacity: 0;
}
</style>
