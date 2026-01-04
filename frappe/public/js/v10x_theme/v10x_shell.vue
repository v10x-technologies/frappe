<template>
  <div class="v10x-layout">
    <!-- TOPBAR -->
    <header class="v10x-header">
      <div class="header-left">
        <a href="/app/home" class="logo">
          <img src="/assets/frappe/images/frappe-framework-logo.svg" alt="Logo">
          <span class="logo-text">Modernize</span>
        </a>
      </div>
      
      <div class="header-right">
        <!-- GLOBAL SEARCH -->
        <div class="top-nav-search">
            <form>
                <input type="text" class="form-control" placeholder="Search here">
                <button class="btn" type="submit"><i class="fas fa-search"></i></button>
            </form>
        </div>

        <!-- NOTIFICATIONS -->
        <ul class="nav user-menu">
            <li class="nav-item">
                <span class="user-img">
                    <div class="avatar avatar-sm">
                        <span class="avatar-title rounded-circle bg-primary-light text-primary">
                            {{ user_initials }}
                        </span>
                    </div>
                    <div class="user-text">
                        <h6>{{ user_fullname }}</h6>
                        <p class="text-muted mb-0">Administrator</p>
                    </div>
                </span>
            </li>
        </ul>
      </div>
    </header>

    <!-- SIDEBAR -->
    <div class="v10x-sidebar" :class="{ 'edit-mode': is_edit_mode }">
      <div class="sidebar-header" v-if="is_edit_mode">
          <button class="btn btn-xs btn-secondary w-100" @click="is_edit_mode = false">Exit Edit</button>
      </div>
      <div class="sidebar-inner slimscroll">
        <div id="sidebar-menu" class="sidebar-menu">
          
          <!-- Public Workspaces -->
          <ul>
            <li class="menu-title">
              <span>Menu</span>
              <i class="fas fa-cog float-end cursor-pointer" @click="toggleEditMode" title="Edit Sidebar"></i>
            </li>
            
            <template v-for="item in public_items" :key="item.name">
                <!-- Group/Parent Item -->
                <li class="submenu" :class="{ active: is_active(item) }">
                    <a href="#" @click.prevent="navigate(item)" :class="{ 'has-arrow': item.children && item.children.length }">
                        <span class="sidebar-icon" v-html="get_icon(item.icon)"></span>
                        <span>{{ item.label }}</span>
                        <span class="menu-arrow" v-if="item.children && item.children.length"></span>
                        
                        <!-- Edit Action -->
                        <i v-if="is_edit_mode" class="fas fa-pencil-alt text-muted ms-2" @click.stop="edit_workspace(item)"></i>
                    </a>
                    
                    <!-- Child Items -->
                    <ul v-if="item.children && item.children.length" style="display: none;">
                        <li v-for="child in item.children" :key="child.name" :class="{ active: is_active(child) }">
                             <a href="#" @click.prevent="navigate(child)">
                                <span>{{ child.label }}</span>
                                <i v-if="is_edit_mode" class="fas fa-pencil-alt text-muted ms-2" @click.stop="edit_workspace(child)"></i>
                             </a>
                        </li>
                    </ul>
                </li>
            </template>
          </ul>
          
          <!-- Private Workspaces -->
          <ul v-if="private_items.length">
             <li class="menu-title"><span>Private</span></li>
              <li v-for="item in private_items" :key="item.name" :class="{ active: is_active(item) }">
                <a href="#" @click.prevent="navigate(item)">
                    <span class="sidebar-icon" v-html="get_icon(item.icon)"></span>
                    <span>{{ item.label }}</span>
                    <i v-if="is_edit_mode" class="fas fa-pencil-alt text-muted ms-2" @click.stop="edit_workspace(item)"></i>
                </a>
            </li>
          </ul>

        </div>
      </div>
    </div>

    <!-- MAIN CONTENT WRAPPER -->
    <!-- This is where Frappe will render its pages. We don't touch this ID. -->
    <!-- We adjust it via CSS to sit next to sidebar -->
  </div>
</template>

<script>
export default {
    name: 'V10xShell',
    data() {
        return {
            user_fullname: frappe.session.user_fullname || 'Administrator',
            user_initials: frappe.get_abbr(frappe.session.user_fullname || 'Administrator'),
            public_items: [],
            private_items: [],
            is_edit_mode: false,
            current_route: frappe.get_route() ? frappe.get_route_str() : ""
        }
    },
    mounted() {
        this.fetchWorkspaces();
        
        // Listen to route changes
        frappe.router.on('change', () => {
            this.current_route = frappe.get_route_str();
        });

        // Initialize jQuery MetisMenu or similar behavior for sidebar toggles
        this.$nextTick(() => {
             // Simple jQuery for submenu toggling
             $(this.$el).on('click', '.has-arrow', function(e) {
                 e.preventDefault();
                 $(this).next('ul').slideToggle();
                 $(this).parent().toggleClass('active');
             });
        });
    },
    methods: {
        async fetchWorkspaces() {
            // Fetch raw items from backend
            let response = await frappe.xcall("frappe.desk.desktop.get_workspace_sidebar_items");
            if (!response || !response.pages) return;

            // Process into Tree
            this.process_sidebar_items(response.pages);
        },
        process_sidebar_items(pages) {
            let public_roots = [];
            let private_roots = [];
            let lookup = {};

            // 1. Initialize Nodes
            pages.forEach(p => {
                p.children = [];
                lookup[p.title] = p; // Title is unique identifier in structure
            });

            // 2. Build Tree
            pages.forEach(p => {
                if (p.parent_page && lookup[p.parent_page]) {
                    lookup[p.parent_page].children.push(p);
                } else {
                    // Root Item
                    if (p.public) {
                        public_roots.push(p);
                    } else {
                        private_roots.push(p);
                    }
                }
            });

            this.public_items = public_roots;
            this.private_items = private_roots;
        },
        navigate(item) {
            // If it has children, let the jQuery logic handle toggle. 
            // BUT if user clicks text, we might want to navigate if it's a valid link?
            // Usually parent items in sidebar are just collapsible.
            if (item.children && item.children.length > 0) return;

            let route = item.public ? item.name : `private/${item.name}`;
            frappe.set_route(frappe.router.slug(route));
        },
        get_icon(icon) {
            return frappe.utils.icon(icon || "folder-normal", "md");
        },
        is_active(item) {
            // Check if current route matches this item or any of its children
            let route_name = frappe.router.slug(item.title);
            if (this.current_route.includes(route_name)) return true;
            
            if (item.children) {
                 return item.children.some(c => this.current_route.includes(frappe.router.slug(c.title)));
            }
            return false;
        },
        toggleEditMode() {
            this.is_edit_mode = !this.is_edit_mode;
            // Optionally toggle internal Frappe edit mode if needed
            // $('body').toggleClass('edit-mode', this.is_edit_mode);
        },
        edit_workspace(item) {
            // Invoke the standard Frappe Workspace Edit Dialog
            // We reuse the logic found in workspace.js
            let me = this;
            const d = new frappe.ui.Dialog({
                title: __('Edit Workspace'),
                fields: [
                    {
                        label: __('Title'),
                        fieldtype: 'Data',
                        fieldname: 'title',
                        reqd: 1,
                        default: item.title
                    },
                    {
                        label: __('Icon'),
                        fieldtype: 'Icon',
                        fieldname: 'icon',
                        default: item.icon
                    },
                    {
                        label: __('Parent'),
                        fieldtype: 'Link',
                        options: 'Workspace',
                        fieldname: 'parent',
                        default: item.parent_page
                    },
                    {
                        label: __('Is Public'),
                        fieldtype: 'Check',
                        fieldname: 'is_public',
                        default: item.public
                    }
                ],
                primary_action_label: __('Save'),
                primary_action: (values) => {
                     frappe.call({
                        method: "frappe.desk.doctype.workspace.workspace.update_page",
                        args: {
                            name: item.name,
                            title: values.title,
                            icon: values.icon,
                            parent: values.parent,
                            public: values.is_public
                        },
                        callback: function(r) {
                            if (!r.exc) {
                                frappe.msgprint("Workspace Updated");
                                me.fetchWorkspaces(); // Refresh tree
                                d.hide();
                            }
                        }
                     });
                }
            });
            d.show();
        }
    }
}
</script>

<style scoped>
/* Scoped styles for the Shell only */
.v10x-header {
    background: #fff;
    border-bottom: 1px solid #f0f0f0;
    height: 70px; /* Modernize header is slightly taller */
    position: fixed;
    top: 0;
    right: 0;
    left: 0;
    z-index: 1001;
    display: flex;
    align-items: center;
    padding: 0 25px;
    box-shadow: 0 0 20px rgba(0,0,0,0.03);
}

.header-left .logo {
    display: flex;
    align-items: center;
    font-weight: 700;
    font-size: 22px;
    color: #2a3547;
    text-decoration: none;
}

.header-left img {
    height: 40px;
    margin-right: 12px;
}

.header-right {
    margin-left: auto;
    display: flex;
    align-items: center;
}

.top-nav-search {
    margin-right: 20px;
}

.v10x-sidebar {
    background-color: #fff;
    width: 270px;
    position: fixed;
    top: 70px;
    bottom: 0;
    left: 0;
    z-index: 1001; /* Above content */
    border-right: 1px solid #ebf1f6;
    transition: all 0.2s ease-in-out;
    overflow-y: auto;
}

.sidebar-menu ul {
    list-style: none;
    padding: 10px;
    margin: 0;
}

.sidebar-menu li a {
    display: flex;
    align-items: center;
    padding: 12px 14px;
    color: #2a3547;
    font-size: 14px;
    text-decoration: none;
    transition: all 0.2s;
    border-radius: 8px;
    margin-bottom: 2px;
}

.sidebar-menu li.active a, .sidebar-menu li a:hover {
    color: #5D87FF;
    background-color: #ecf2ff;
}

.sidebar-menu li i {
    margin-right: 12px;
    font-size: 10px; /* Modernize uses small circles usually */
    width: 20px;
    text-align: center;
}

.user-text h6 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
}
.user-text p {
    font-size: 12px;
}

.user-img {
    display: flex;
    align-items: center;
    gap: 10px;
}
</style>
