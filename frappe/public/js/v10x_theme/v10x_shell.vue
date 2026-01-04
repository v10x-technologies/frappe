<template>
  <div class="v10x-layout">
    <V10xHeader 
        :sidebar_collapsed="sidebar_collapsed"
        :user_fullname="user_fullname"
        :user_initials="user_initials"
        @toggle-hide="toggleHide" 
    />

    <V10xSidebar 
        :sidebar_collapsed="sidebar_collapsed"
        :current_route="current_route"
        @toggle-collapse="toggleCollapse"
    />

    <!-- MAIN CONTENT WRAPPER -->
    <!-- This is where Frappe will render its pages (workspace content) -->
  </div>
</template>

<script>
// Import components
// Note: frappe build system might require extensions or specific paths
import V10xHeader from './components/V10xHeader.vue';
import V10xSidebar from './components/V10xSidebar.vue';

export default {
    name: 'V10xShell',
    components: {
        V10xHeader,
        V10xSidebar
    },
    data() {
        return {
            user_fullname: frappe.session.user_fullname || 'Administrator',
            user_initials: frappe.get_abbr(frappe.session.user_fullname || 'Administrator'),
            sidebar_collapsed: localStorage.getItem('v10x_sidebar_collapsed') === 'true',
            sidebar_hidden: localStorage.getItem('v10x_sidebar_hidden') === 'true',
            current_route: frappe.get_route() ? frappe.get_route_str() : ""
        }
    },
    mounted() {
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
        });
    },
    methods: {
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
}
</style>
