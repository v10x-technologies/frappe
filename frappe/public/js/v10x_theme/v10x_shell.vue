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
        @toggle-secondary-sidebar="showSecondarySidebar = !showSecondarySidebar" 
    />

    <V10xSidebar 
        :sidebar_collapsed="sidebar_collapsed"
        :current_route="current_route"
        @toggle-collapse="toggleCollapse"
        @workspace-selected="onWorkspaceClick"
    />

    <!-- SECONDARY SIDEBAR -->
    <V10xSecondarySidebar 
        :isOpen="showSecondarySidebar"
        :workspaceName="workspace_name"
        :menuItems="menuItems"
        @close="showSecondarySidebar = false"
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
import V10xSecondarySidebar from './components/V10xSecondarySidebar.vue';

export default {
    name: 'V10xShell',
    components: {
        V10xHeader,
        V10xSidebar,
        V10xWorkspace,
        V10xPageHeader,
        V10xSecondarySidebar
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
            is_portaling: false,
            showSecondarySidebar: false,
            menuItems: [],
            activeWorkspaceName: '',
            workspaceCache: {}
        }
    },
    watch: {
        showSecondarySidebar() {
            this.applyLayoutState();
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
        const loadCSS = (id, href) => {
            if (!document.getElementById(id)) {
                let link = document.createElement('link');
                link.id = id;
                link.rel = 'stylesheet';
                link.href = href;
                document.head.appendChild(link);
            }
        };

        loadCSS('mdi-font', 'https://cdn.jsdelivr.net/npm/@mdi/font@7.2.96/css/materialdesignicons.min.css');
        loadCSS('material-icons', 'https://fonts.googleapis.com/icon?family=Material+Icons');

        this.applyLayoutState();
        
        // Listen to route changes
        frappe.router.on('change', () => {
            this.current_route = frappe.get_route_str();
            this.handlePortalVisibility();
            // On direct page load, check if we need to show secondary sidebar
            this.checkSecondarySidebarOnLoad();
        });

        this.handlePortalVisibility();
        this.setupMutationObserver();
        this.checkSecondarySidebarOnLoad();
    },
    beforeUnmount() {
        this.cleanupMutationObserver();
    },
    methods: {
        checkSecondarySidebarOnLoad() {
             if (this.is_workspace && this.workspace_name) {
                 // Slugify active name to compare with route slug
                 const activeSlug = this.activeWorkspaceName ? frappe.router.slug(this.activeWorkspaceName) : '';
                 
                 // Only load if they differ (User navigated via URL/History not Click)
                 if (activeSlug !== this.workspace_name) {
                     this.loadWorkspace(this.workspace_name);
                 }
             } else {
                 this.showSecondarySidebar = false;
                 this.menuItems = [];
                 this.activeWorkspaceName = '';
             }
        },
        onWorkspaceClick(name) {
             // Smart Toggle Logic (User Interaction)
             if (this.activeWorkspaceName === name) {
                 if (this.menuItems.length > 0) {
                     this.showSecondarySidebar = !this.showSecondarySidebar;
                 }
             } else {
                 // New Workspace
                 this.loadWorkspace(name);
             }
        },
        loadWorkspace(name) {
             // 1. Cache Check
             if (this.workspaceCache[name]) {
                 this.activeWorkspaceName = name;
                 this.processWorkspaceData(this.workspaceCache[name]);
                 return;
             }

             frappe.call({
                method: 'frappe.client.get',
                args: {
                    doctype: 'Workspace',
                    name: name
                },
                freeze: false
            }).then(r => {
                if (r.message) {
                    // Normalize active name from response to ensure consistency
                    const canonicalName = r.message.name;
                    this.activeWorkspaceName = canonicalName;
                    
                    // Cache with both the requested key and canonical name
                    this.workspaceCache[name] = r.message;
                    if (name !== canonicalName) {
                        this.workspaceCache[canonicalName] = r.message;
                    }

                    this.processWorkspaceData(r.message);
                } else {
                    this.showSecondarySidebar = false;
                    this.menuItems = [];
                    // Even if failed, we update active name to prevent infinite retry loops
                    this.activeWorkspaceName = name; 
                }
            }).catch(err => {
                console.error('[V10xShell] Error:', err);
                this.showSecondarySidebar = false;
                this.menuItems = [];
                this.activeWorkspaceName = name; 
            });
        },
        processWorkspaceData(data) {
             const menuData = data.custom_menu || data.menu || data.sidebar_secondary || [];
             if (menuData.length > 0) {
                this.menuItems = menuData;
                this.showSecondarySidebar = true; // Auto-show on new workspace if items exist
             } else {
                this.menuItems = [];
                this.showSecondarySidebar = false;
             }
        },
        handlePortalVisibility() {
            if (this.is_workspace) {
                $('.layout-main-section').hide();
                $('.page-head').hide();
            } else {
                $('.layout-main-section').show();
                $('.page-head').hide(); 
            }
        },
        setupMutationObserver() {
            const target = document.querySelector('#v10x-body-portal');
            if (!target) return;

            // Debounce the observer callback to reduce lag
            let timeout;
            this.observer = new MutationObserver((mutations) => {
                if (timeout) clearTimeout(timeout);
                timeout = setTimeout(() => {
                    this.portalPageActions();
                }, 100); // 100ms debounce
            });

            this.observer.observe(target, { 
                childList: true, 
                subtree: true,
                attributes: true,
                attributeFilter: ['style', 'class', 'hidden'] // Limit observed attributes
            });
            
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

            // Use requestAnimationFrame for smoother UI updates
            requestAnimationFrame(() => {
                try {
                    // ... existing portal logic ...
                    const $bcPortal = $('#v10x-breadcrumbs-portal');
                    const $titlePortal = $('#v10x-title-text-portal');
                    const $customPortal = $('#v10x-custom-actions-portal');
                    const $standardPortal = $('#v10x-standard-actions-portal');

                    if (!$titlePortal.length) {
                        this.is_portaling = false;
                        return;
                    }

                    const $bcSource = $('#navbar-breadcrumbs');
                    const $activePage = $('.page-container:visible');
                    
                    if (!$activePage.length) {
                        $bcPortal.empty();
                        $titlePortal.empty();
                        $customPortal.empty();
                        $standardPortal.empty();
                        this.is_portaling = false;
                        return;
                    }

                    const $sourceHeader = $activePage.find('.page-head');
                    const $titleArea = $sourceHeader.find('.title-area');
                    const $customActions = $sourceHeader.find('.custom-actions');
                    const $standardActions = $sourceHeader.find('.standard-actions');

                    const moveIfNew = ($portal, $source) => {
                        if ($source.length) {
                            if (!$source.closest($portal).length) {
                                $portal.empty(); 
                                $source.appendTo($portal).show();
                                $source.removeClass('hide hidden-xs hidden-md');
                            }
                        }
                    };

                    moveIfNew($bcPortal, $bcSource);
                    moveIfNew($titlePortal, $titleArea);
                    moveIfNew($customPortal, $customActions);
                    moveIfNew($standardPortal, $standardActions);

                    $standardActions.find('.btn').removeClass('hide');
                    $customActions.find('.btn').removeClass('hide');

                } catch(e) { 
                    // Silent fail
                } finally {
                    this.is_portaling = false;
                }
            });
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
            
            if (this.showSecondarySidebar) {
                $('body').addClass('v10x-secondary-sidebar-open');
            } else {
                $('body').removeClass('v10x-secondary-sidebar-open');
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

body.v10x-secondary-sidebar-open .v10x-main-content {
    margin-left: 490px; /* 240px + 250px */
}

body.v10x-sidebar-collapsed.v10x-secondary-sidebar-open .v10x-main-content {
    margin-left: 310px; /* 60px + 250px */
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
