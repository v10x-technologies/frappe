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
        <!-- Main content area -->
        <div id="v10x-frappe-portal">
            <V10xPageHeader :show="true" />
            
            <div class="v10x-content-area">
                <div class="v10x-content-inner">
                    <!-- V10x Workspace View -->
                    <div v-if="is_workspace" class="v10x-workspace-view">
                        <V10xWorkspace 
                            :workspace_name="workspace_name" 
                            :is_public="is_workspace_public" 
                        />
                    </div>

                    <!-- Frappe #body will be moved here via bundle.js -->
                    <div id="v10x-body-portal"></div>
                </div>
            </div>
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
import V10xPageHeader from './components/V10xPageHeader.vue';

export default {
    name: 'V10xShell',
    components: {
        V10xHeader,
        V10xSidebar,
        V10xWorkspace,
        V10xPageHeader
    },
    data() {
        return {
            user_fullname: frappe.session.user_fullname || 'Administrator',
            user_initials: frappe.get_abbr(frappe.session.user_fullname || 'Administrator'),
            sidebar_collapsed: localStorage.getItem('v10x_sidebar_collapsed') === 'true',
            sidebar_hidden: localStorage.getItem('v10x_sidebar_hidden') === 'true',
            current_route: frappe.get_route() ? frappe.get_route_str() : "",
            app_name: 'V10xERP',
            app_logo: '/assets/frappe/images/frappe-framework-logo.svg',
            observer: null,
            is_portaling: false
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
            
            // Try to get title from current page if portal already happened
            const $title = $('#v10x-page-title-portal .title-text');
            if ($title.length && $title.text()) return $title.text();

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
        this.setupMutationObserver();
    },
    beforeUnmount() {
        this.cleanupMutationObserver();
    },
    methods: {
        handlePortalVisibility() {
            if (this.is_workspace) {
                $('.layout-main-section').hide();
                $('.page-head').hide();
            } else {
                $('.layout-main-section').show();
                $('.page-head').hide(); 
            }
            // MutationObserver handles the actual portaling now
        },
        setupMutationObserver() {
            const target = document.querySelector('#v10x-body-portal');
            if (!target) return;

            this.observer = new MutationObserver((mutations) => {
                // Throttle slightly if needed, but for now just run
                this.portalPageActions();
            });

            this.observer.observe(target, { 
                childList: true, 
                subtree: true,
                attributes: true,
                attributeFilter: ['style', 'class']
            });
            
            // Initial run
            this.portalPageActions();
        },
        cleanupMutationObserver() {
            if (this.observer) {
                this.observer.disconnect();
                this.observer = null;
            }
        },
        portalPageActions() {
            if (this.is_portaling) return;
            this.is_portaling = true;

            try {
                // 1. Get Portal containers
                const $bcPortal = $('#v10x-breadcrumbs-portal');
                const $titlePortal = $('#v10x-title-text-portal');
                const $customPortal = $('#v10x-custom-actions-portal');
                const $standardPortal = $('#v10x-standard-actions-portal');
                const $morePortal = $('#v10x-more-actions-portal');

                if (!$titlePortal.length) return;

                // 2. Identify ACTIVE source elements
                const $bcSource = $('#navbar-breadcrumbs');
                const $activePage = $('.page-container:visible');
                
                if (!$activePage.length) {
                    $bcPortal.empty();
                    $titlePortal.empty();
                    $customPortal.empty();
                    $standardPortal.empty();
                    $morePortal.empty();
                    return;
                }
                

                // IMPORTANT: Frappe's .page-head contains the original elements
                const $sourceHeader = $activePage.find('.page-head');
                const $titleArea = $sourceHeader.find('.title-area');
                const $customActions = $sourceHeader.find('.custom-actions');
                const $standardActions = $sourceHeader.find('.standard-actions');
                const $moreButton = $sourceHeader.find('.more-button');

                // 3. Update Title Portal (Breadcrumbs + Title)
                // If we found a NEW title area, we should move it.
                // But don't empty if we already have the RIGHT element.
                
                const moveIfNew = ($portal, $source, name) => {
                    if ($source.length) {
                        if (!$source.closest($portal).length) {
                            $portal.empty(); 
                            $source.appendTo($portal).show();
                            $source.removeClass('hide hidden-xs hidden-md');
                        }
                    }
                };

                moveIfNew($bcPortal, $bcSource, "Breadcrumbs");
                moveIfNew($titlePortal, $titleArea, "Title");
                moveIfNew($customPortal, $customActions, "Custom Actions");
                moveIfNew($standardPortal, $standardActions, "Standard Actions");
                moveIfNew($morePortal, $moreButton, "More Menu");

                // Ensure visibility of internal buttons which Frappe often hides
                $standardActions.find('.btn').removeClass('hide');
                $customActions.find('.btn').removeClass('hide');

            } finally {
                // Delay resetting the flag slightly to catch any echo mutations
                setTimeout(() => {
                    this.is_portaling = false;
                }, 50);
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
    min-height: 100vh;
}

.v10x-main-content {
    margin-left: 240px;
    margin-top: 70px; /* Matches fixed header height */
    flex: 1;
    transition: margin-left 0.2s ease-in-out;
    background-color: var(--bg-color); /* Metronic gray background for content */
    z-index: 1;
    position: relative;
    display: flex;
    flex-direction: column;
}

#v10x-frappe-portal {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.v10x-content-area {
    flex: 1;
    position: relative;
}

.v10x-content-inner {
    padding: 25px;
    width: 100%;
}

body.v10x-sidebar-collapsed .v10x-main-content {
    margin-left: 60px;
}

body.v10x-sidebar-hidden .v10x-main-content {
    margin-left: 0;
}

@media (max-width: 991px) {
    .v10x-main-content {
        margin-left: 0;
    }
}

/* Ensure layout-main-section behaves within our flex shell */
:deep(.layout-main-section) {
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 !important;
}

/* Force Bootstrap containers to cover 100% width */
:deep(.container), 
:deep(.container-xl), 
:deep(.container-lg), 
:deep(.container-md), 
:deep(.container-sm) {
    max-width: 100% !important;
    width: 100% !important;
    padding-left: 15px;
    padding-right: 15px;
}
</style>
