<template>
    <header class="v10x-header">
      <div class="header-left d-flex align-items-center">
        <a href="/app/home" class="logo me-3">
          <img :src="app_logo" alt="Logo" v-if="!sidebar_collapsed" style="max-height: 30px;">
          <span class="logo-text ms-2" v-if="!sidebar_collapsed">{{ app_name }}</span>
          <span class="logo-text-mini" v-else>{{ logo_initial }}</span>
        </a>
        <button class="btn-reset ms-2" @click="toggleHide" :title="sidebar_hidden ? 'Show Sidebar' : 'Hide Sidebar'">
            <i class="mdi" :class="sidebar_hidden ? 'mdi-menu' : 'mdi-close'" style="font-size: 24px;"></i>
        </button>
      </div>
      
      <div class="header-right">
        <!-- GLOBAL SEARCH -->
        <div class="top-nav-search">
            <form role="search" onsubmit="return false;">
                <div class="search-input-wrapper">
                    <i class="mdi mdi-magnify search-icon"></i>
                    <input id="navbar-search" type="text" class="form-control" placeholder="Search here">
                </div>
            </form>
        </div>

        <!-- NOTIFICATIONS -->
        <div class="nav-item dropdown notifications-dropdown me-3">
            <a href="#" class="dropdown-toggle nav-link" data-toggle="dropdown" data-bs-toggle="dropdown" aria-expanded="false">
                <i class="mdi mdi-bell-outline"></i> 
                <span class="badge badge-pill" v-if="unread_count > 0">{{ unread_count }}</span>
            </a>
            <div class="dropdown-menu notifications dropdown-menu-right">
                <div class="topnav-dropdown-header">
                    <span class="notification-title">Notifications</span>
                    <a href="javascript:void(0)" class="clear-noti" @click.stop="mark_all_read"> Mark all as read </a>
                </div>
                <div class="noti-content">
                    <ul class="notification-list">
                        <li class="notification-message" v-for="note in notifications" :key="note.name" :class="{ 'unread': !note.read }">
                            <a :href="get_link(note)" @click="mark_as_read(note)">
                                <div class="media d-flex">
                                    <span class="avatar avatar-sm flex-shrink-0">
                                        <img class="avatar-img rounded-circle" :src="get_avatar_url(note)" alt="User Image">
                                    </span>
                                    <div class="media-body flex-grow-1">
                                        <p class="noti-details">
                                            <span class="noti-title">{{ get_sender_name(note) }}</span> 
                                            <span v-html="get_subject(note)"></span>
                                        </p>
                                        <p class="noti-time">
                                            <span class="notification-time">{{ format_time(note.creation) }}</span>
                                        </p>
                                    </div>
                                </div>
                            </a>
                        </li>
                        <li v-if="notifications.length === 0" class="notification-message">
                            <div class="text-center p-3 text-muted">
                                No new notifications
                            </div>
                        </li>
                    </ul>
                </div>
                <div class="topnav-dropdown-footer">
                    <a href="/app/List/Notification Log">View all Notifications</a>
                </div>
            </div>
        </div>

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
</template>

<script>
export default {
    name: 'V10xHeader',
    props: ['sidebar_collapsed', 'sidebar_hidden', 'user_fullname', 'user_initials', 'app_name', 'app_logo'],
    data() {
        return {
            notifications: [],
            unread_count: 0
        };
    },
    computed: {
        logo_initial() {
            return this.app_name ? this.app_name.charAt(0).toUpperCase() : 'M';
        }
    },
    methods: {
        toggleHide() {
            this.$emit('toggle-hide');
        },
        fetch_notifications() {
            frappe.call('frappe.desk.doctype.notification_log.notification_log.get_notification_logs', {
                limit: 20
            }).then(r => {
                if (r.message) {
                    this.notifications = r.message.notification_logs;
                    this.update_unread_count();
                }
            });
        },
        update_unread_count() {
            this.unread_count = this.notifications.filter(n => !n.read).length;
        },
        mark_as_read(note) {
            if (!note.read) {
                frappe.call('frappe.desk.doctype.notification_log.notification_log.mark_as_read', {
                    docname: note.name
                }).then(() => {
                    note.read = 1;
                    this.update_unread_count();
                });
            }
        },
        mark_all_read() {
            frappe.call('frappe.desk.doctype.notification_log.notification_log.mark_all_as_read').then(() => {
                this.notifications.forEach(n => n.read = 1);
                this.update_unread_count();
            });
        },
        get_avatar_url(note) {
             if (typeof frappe === 'undefined' || !frappe.user_info) return '/assets/frappe/images/default-avatar.png';
             let user_info = frappe.user_info(note.from_user);
             return (user_info && user_info.image) ? user_info.image : '/assets/frappe/images/default-avatar.png';
        },
        get_sender_name(note) {
            return frappe.user.full_name(note.from_user);
        },
        get_subject(note) {
             let message = note.subject;
             let title = message.match(/<b class="subject-title">(.*?)<\/b>/);
             return title ? title[1] : message;
        },
        get_link(note) {
             if (note.link) return note.link;
             return `/app/${note.document_type || 'Notification Log'}/${note.document_name || note.name}`;
        },
        format_time(creation) {
            return frappe.datetime.comment_when(creation);
        },
        setup_search() {
            if (typeof frappe !== 'undefined' && frappe.search && frappe.search.AwesomeBar) {
                this.search_bar = new frappe.search.AwesomeBar();
                this.search_bar.setup("#navbar-search");

                // Tab key auto-select logic
                const $input = $("#navbar-search");
                $input.on("keydown", (e) => {
                    if (e.key === "Tab") {
                        const awesomplete = this.search_bar.awesomplete;
                        if (awesomplete && awesomplete.opened && awesomplete.ul.children.length > 0) {
                            e.preventDefault();
                            awesomplete.select();
                        }
                    }
                });
            }
        },
        setup_realtime() {
            frappe.realtime.on('notification', () => {
                this.fetch_notifications();
            });
             frappe.realtime.on('indicator_hide', () => {
                 this.fetch_notifications();
            });
        }
    },
    mounted() {
        this.fetch_notifications();
        this.setup_realtime();
        this.setup_search();
    }
}
</script>

<style scoped>
.v10x-header {
    background: #fff;
    border-bottom: 1px solid #f0f0f0;
    height: 70px;
    position: fixed;
    top: 0;
    right: 0;
    left: 0;
    z-index: 3000;
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
    position: relative;
    max-width: 400px;
    width: 100%;
}

.search-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
}

.search-input-wrapper .search-icon {
    position: absolute;
    left: 15px;
    color: var(--text-muted);
    font-size: 20px;
    pointer-events: none;
    z-index: 10;
}

.top-nav-search .form-control {
    padding-left: 45px;
    width: 100%;
}

:deep(.awesomplete) {
    width: 100%;
    position: relative;
}

:deep(.awesomplete > ul) {
    width: 100%;
    min-width: 200px;
    max-width: 300px;
    top: 100%;
    margin-top: 5px;
    border-radius: 8px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.1);
    border: 1px solid #dfe5ef;
    background: #fff;
    padding: 8px 0;
    overflow-x: hidden;
    z-index: 3001;
}

:deep(.awesomplete li) {
    padding: 8px 15px;
    border-radius: 0;
}

:deep(.awesomplete li:hover),
:deep(.awesomplete li[aria-selected="true"]) {
    background-color: #f3f6f9;
}

:deep(.awesomplete mark) {
    background: transparent;
    color: var(--primary);
    font-weight: 700;
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

/* Notifications Styles */
.notifications-dropdown .dropdown-toggle {
    color: #333;
    padding: 5px 10px;
    position: relative;
    font-size: 20px;
}
.notifications-dropdown .badge {
    position: absolute;
    top: 0;
    right: 0;
    background-color: #fc6075;
    color: #fff;
    font-size: 10px;
    padding: 3px 6px;
    border-radius: 50%;
}

.notifications-dropdown .dropdown-menu {
    width: 350px;
    padding: 0;
    border: 0;
    box-shadow: 0 0 20px rgba(0,0,0,0.1);
    z-index: 3001;
}

.topnav-dropdown-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px;
    border-bottom: 1px solid #f0f0f0;
}
.notification-title {
    font-weight: 600;
    font-size: 16px;
}
.clear-noti {
    font-size: 12px;
    color: #fc6075;
    text-decoration: none;
}

.noti-content {
    max-height: 300px;
    overflow-y: auto;
}

.notification-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.notification-message {
    border-bottom: 1px solid #f0f0f0;
}
.notification-message:last-child {
    border-bottom: none;
}
.notification-message a {
    display: block;
    padding: 12px 15px;
    color: #333;
    text-decoration: none;
    transition: background-color 0.2s;
}
.notification-message a:hover {
    background-color: #f9f9f9;
}
.notification-message.unread {
    background-color: #f0f7ff;
}

.media {
    display: flex;
    align-items: flex-start;
}
.avatar-sm {
    width: 32px;
    height: 32px;
    margin-right: 10px;
}
.avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.noti-details {
    margin: 0;
    font-size: 13px;
    line-height: 1.4;
}
.noti-title {
    color: #333;
    font-weight: 600;
}
.noti-time {
    margin: 5px 0 0;
    font-size: 11px;
    color: #888;
}

.topnav-dropdown-footer {
    border-top: 1px solid #f0f0f0;
    text-align: center;
}
.topnav-dropdown-footer a {
    display: block;
    padding: 12px;
    color: #333;
    font-size: 13px;
    text-decoration: none;
}
</style>
