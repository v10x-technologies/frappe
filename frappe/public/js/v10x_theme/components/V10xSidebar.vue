<template>
    <div class="v10x-sidebar" :class="{ 'edit-mode': is_edit_mode, 'collapsed': sidebar_collapsed }">
      <div class="sidebar-header" v-if="is_edit_mode && !sidebar_collapsed">
          <div class="d-flex gap-2 p-2">
            <button class="btn btn-xs btn-primary flex-grow-1" @click="create_workspace"><i class="fas fa-plus"></i> New</button>
            <button class="btn btn-xs btn-secondary flex-grow-1" @click="is_edit_mode = false">Exit</button>
          </div>
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
      
      <!-- SIDEBAR FOOTER (Fixed Bottom) -->
      <div class="sidebar-footer">
          <button class="btn-reset w-100" @click="toggleCollapse" :title="sidebar_collapsed ? 'Expand' : 'Collapse'">
              <i class="mdi" :class="sidebar_collapsed ? 'mdi-arrow-collapse-right' : 'mdi-arrow-collapse-left'"></i>
          </button>
      </div>
    </div>
</template>

<script>
export default {
    name: 'V10xSidebar',
    props: ['sidebar_collapsed', 'current_route'],
    data() {
        return {
            public_items: [],
            private_items: [],
            is_edit_mode: false,
        }
    },
    mounted() {
        this.fetchWorkspaces();
        // jQuery for submenu toggles can go here or parent
        this.$nextTick(() => {
             $(this.$el).on('click', '.has-arrow', function(e) {
                 e.preventDefault();
                 if (!$(this).closest('.v10x-sidebar').hasClass('collapsed')) {
                     $(this).next('ul').slideToggle();
                     $(this).parent().toggleClass('active');
                 }
             });
        });
    },
    methods: {
        async fetchWorkspaces() {
            let response = await frappe.xcall("frappe.desk.desktop.get_workspace_sidebar_items");
            if (!response || !response.pages) return;
            this.process_sidebar_items(response.pages);
        },
        process_sidebar_items(pages) {
            let public_roots = [];
            let private_roots = [];
            let lookup = {};

            pages.forEach(p => {
                p.children = [];
                lookup[p.title] = p; 
            });

            pages.forEach(p => {
                if (p.parent_page && lookup[p.parent_page]) {
                    lookup[p.parent_page].children.push(p);
                } else {
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
             // In collapsed mode, clicks only navigate
            if (!this.sidebar_collapsed && item.children && item.children.length > 0) return;

            let route = item.public ? item.name : `private/${item.name}`;
            frappe.set_route(frappe.router.slug(route));
        },
        get_icon(icon) {
            if (icon && (icon.includes(" ") || icon.startsWith("fa-") || icon.startsWith("fas") || icon.startsWith("far") || icon.startsWith("lni") || icon.startsWith("mdi"))) {
                return `<i class="${icon}"></i>`;
            }
            return frappe.utils.icon(icon || "folder-normal", "md");
        },
        is_active(item) {
            let route_name = frappe.router.slug(item.title);
            if (this.current_route.includes(route_name)) return true;
            if (item.children) {
                 return item.children.some(c => this.current_route.includes(frappe.router.slug(c.title)));
            }
            return false;
        },
        toggleEditMode() {
            this.is_edit_mode = !this.is_edit_mode;
            if (this.is_edit_mode && this.sidebar_collapsed) {
                this.$emit('toggle-collapse');
            }
        },
        toggleCollapse() {
            this.$emit('toggle-collapse');
        },
        create_workspace() {
            let me = this;
            const d = new frappe.ui.Dialog({
                title: __('New Workspace'),
                fields: [
                    {
                        label: __('Title'),
                        fieldtype: 'Data',
                        fieldname: 'title',
                        reqd: 1
                    },
                    {
                        label: __('Icon'),
                        fieldtype: 'Data',
                        fieldname: 'icon',
                        description: 'e.g. "fas fa-home"'
                    },
                    {
                        label: __('Parent'),
                        fieldtype: 'Link',
                        options: 'Workspace',
                        fieldname: 'parent'
                    },
                    {
                        label: __('Is Public'),
                        fieldtype: 'Check',
                        fieldname: 'is_public',
                        default: 1
                    }
                ],
                primary_action_label: __('Create'),
                primary_action: (values) => {
                     let name = values.title + (values.is_public ? "" : "-" + frappe.session.user);
                     let blocks = [{ type: "header", data: { text: values.title } }];
                     let new_page = {
                        content: JSON.stringify(blocks),
                        name: name,
                        label: name,
                        title: values.title,
                        public: values.is_public || 0,
                        for_user: values.is_public ? "" : frappe.session.user,
                        icon: values.icon,
                        parent_page: values.parent || "",
                        is_editable: true,
                        selected: true,
                     };

                     frappe.call({
                        method: "frappe.desk.doctype.workspace.workspace.new_page",
                        args: { new_page: new_page },
                        callback: function(r) {
                            if (r.message) {
                                frappe.msgprint("Workspace Created");
                                me.fetchWorkspaces();
                                d.hide();
                                let route = values.is_public ? values.title : `private/${values.title}`;
                                frappe.set_route(frappe.router.slug(route));
                            }
                        }
                     });
                }
            });
            d.show();
        },
        edit_workspace(item) {
             let me = this;
            const d = new frappe.ui.Dialog({
                title: __('Edit Workspace'),
                fields: [
                    {
                        label: __('Title'),
                        fieldtype: 'Data',
                        fieldname: 'title',
                        reqd: 1,
                        default: item.title,
                        read_only: 1
                    },
                    {
                        label: __('Icon'),
                        fieldtype: 'Data',
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
                            title: item.title, 
                            icon: values.icon,
                            parent: values.parent,
                            public: values.is_public
                        },
                        callback: function(r) {
                            if (!r.exc) {
                                frappe.msgprint("Workspace Updated");
                                me.fetchWorkspaces(); 
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
.v10x-sidebar {
    background-color: #fff;
    width: 240px;
    position: fixed;
    top: 70px;
    bottom: 0;
    left: 0;
    z-index: 1001; 
    border-right: 1px solid #ebf1f6;
    transition: all 0.2s ease-in-out;
    display: flex;
    flex-direction: column;
}

.sidebar-inner {
    flex-grow: 1;
    overflow-y: auto;
    overflow-x: hidden;
}

.sidebar-footer {
    padding: 10px;
    border-top: 1px solid #ebf1f6;
    background: #fff;
    display: flex;
    justify-content: center;
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
    font-size: 10px; 
    width: 20px;
    text-align: center;
}

.edit-mode .v10x-sidebar {
    border-right: 2px dashed #5D87FF;
}

.cursor-pointer {
    cursor: pointer;
}

.fa-cog {
    color: #999;
    transition: color 0.2s;
}

.fa-cog:hover {
    color: #5D87FF;
}

.sidebar-header {
    padding: 10px;
    background: #f0f0f0;
    border-bottom: 1px solid #e5e5e5;
}

.sidebar-icon svg {
    width: 16px;
    height: 16px;
    margin-right: 10px;
}

.sidebar-icon .icon {
    width: 16px;
    height: 16px;
    margin-right: 10px;
}

/* Collapsed Logic */
.v10x-sidebar.collapsed {
    width: 5vw !important;
    min-width: 50px;
}

.v10x-sidebar.collapsed .sidebar-menu .menu-title,
.v10x-sidebar.collapsed .sidebar-menu li a span:not(.sidebar-icon),
.v10x-sidebar.collapsed .menu-arrow {
    display: none !important;
}

.v10x-sidebar.collapsed .sidebar-menu li a {
    justify-content: center;
    padding: 15px 0;
}

.v10x-sidebar.collapsed .sidebar-icon {
    margin-right: 0;
    font-size: 24px;
}
</style>
