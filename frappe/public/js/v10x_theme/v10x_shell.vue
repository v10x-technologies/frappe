<template>
  <div class="v10x-layout">
    <V10xHeader 
        :sidebar_collapsed="sidebar_collapsed"
        :sidebar_hidden="sidebar_hidden"
        :user_fullname="user_fullname"
        :user_initials="user_initials"
        :app_name="app_name"
        :app_logo="app_logo"
        @toggle-hide="toggleHide" 
    />

    <V10xSidebar 
        :sidebar_collapsed="sidebar_collapsed"
        :current_route="current_route"
        @toggle-collapse="toggleCollapse"
    />

    <!-- MAIN CONTENT WRAPPER -->
    <main class="v10x-main-content">
        <!-- V10x Workspace View -->
        <div v-if="is_workspace" class="v10x-workspace-view">
            <V10xWorkspace 
                :workspace_name="workspace_name" 
                :is_public="is_workspace_public" 
            />
        </div>

        <!-- Stable Portal for standard Frappe content -->
        <div id="v10x-frappe-portal" v-show="!is_workspace">
            <!-- Frappe #body will be moved here via bundle.js -->
        </div>
    </main>
  </div>
</template>

<script>
// Import components
// Note: frappe build system might require extensions or specific paths
import V10xHeader from './components/V10xHeader.vue';
import V10xSidebar from './components/V10xSidebar.vue';
import V10xWorkspace from './components/workspace/V10xWorkspace.vue';

export default {
    name: 'V10xShell',
    components: {
        V10xHeader,
        V10xSidebar,
        V10xWorkspace
    },
    data() {
        return {
            user_fullname: frappe.session.user_fullname || 'Administrator',
            user_initials: frappe.get_abbr(frappe.session.user_fullname || 'Administrator'),
            sidebar_collapsed: localStorage.getItem('v10x_sidebar_collapsed') === 'true',
            sidebar_hidden: localStorage.getItem('v10x_sidebar_hidden') === 'true',
            current_route: frappe.get_route() ? frappe.get_route_str() : "",
            app_name: 'V10xERP',
            app_logo: '/assets/frappe/images/frappe-framework-logo.svg'
        }
    },
    computed: {
        is_workspace() {
            const route = frappe.get_route();
            if (!route) return false;
            const base = route[0] ? route[0].toLowerCase() : "";
            return base === "workspaces";
        },
        workspace_name() {
            const route = frappe.get_route();
            if (!this.is_workspace) return '';
            if (route.length === 1) return frappe.boot.home_page || "Home";
            return route[1] === 'private' ? route[2] : route[1];
        },
        is_workspace_public() {
            const route = frappe.get_route();
            return route && route[1] !== 'private';
        }
    },
    mounted() {
        // Fetch Website Settings for Branding
        frappe.db.get_single_value('Website Settings', 'app_name').then(val => {
             if (val) this.app_name = val;
        });
        frappe.db.get_single_value('Website Settings', 'app_logo').then(val => {
             if (val) this.app_logo = val;
        });

        // Load Material Design Icons (Runtime Injection to avoid Build Errors)
        if (!document.getElementById('mdi-font')) {
            let link = document.createElement('link');
            link.id = 'mdi-font';
            link.rel = 'stylesheet';
            link.href = 'https://cdn.jsdelivr.net/npm/@mdi/font@7.2.96/css/materialdesignicons.min.css';
            document.head.appendChild(link);
        }

        this.applyLayoutState();
        
        // Listen to route changes
        frappe.router.on('change', () => {
            this.current_route = frappe.get_route_str();
            this.handlePortalVisibility();
        });

        this.handlePortalVisibility();
    },
    methods: {
        handlePortalVisibility() {
            console.log(`[V10x] is_workspace: ${this.is_workspace}, route:`, frappe.get_route());
            // Standard pages use #body inside our portal.
            // Workspace pages show V10xWorkspace and hide the portal.
            if (this.is_workspace) {
                // When on workspace, we might still need to hide original page-head if it exists
                $('.layout-main-section-wrapper').hide();
                $('.page-head').hide();
            } else {
                $('.layout-main-section-wrapper').show();
                $('.page-head').show();
            }
        },
        toggleCollapse() {
            this.sidebar_collapsed = !this.sidebar_collapsed;
            localStorage.setItem('v10x_sidebar_collapsed', this.sidebar_collapsed);
            this.applyLayoutState();
        },
        toggleHide() {
            this.sidebar_hidden = !this.sidebar_hidden;
            localStorage.setItem('v10x_sidebar_hidden', this.sidebar_hidden);
            this.applyLayoutState();
        },
        applyLayoutState() {
            if (this.sidebar_hidden) {
                $('body').addClass('v10x-sidebar-hidden');
            } else {
                $('body').removeClass('v10x-sidebar-hidden');
            }
            
            if (this.sidebar_collapsed) {
                $('body').addClass('v10x-sidebar-collapsed');
            } else {
                $('body').removeClass('v10x-sidebar-collapsed');
            }
        }
    }
}
</script>

<style scoped>
/* Only shell layout styles here, component styles are inside components */
.v10x-layout {
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
}

.v10x-main-content {
    margin-left: 240px;
    margin-top: 70px;
    flex: 1;
    overflow-y: auto;
    transition: margin-left 0.3s ease;
    background-color: #f8fafc;
}

/* Centered container for 85% screen usage */
.v10x-workspace-view, #v10x-frappe-portal {
    max-width: 85%;
    margin: 0 auto;
    width: 100%;
}

body.v10x-sidebar-collapsed .v10x-main-content {
    margin-left: 5vw;
}

@media (max-width: 991px) {
    .v10x-main-content {
        margin-left: 0;
    }
}
</style>
