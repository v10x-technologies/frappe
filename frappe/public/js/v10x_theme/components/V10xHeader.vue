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
</template>

<script>
export default {
    name: 'V10xHeader',
    props: ['sidebar_collapsed', 'sidebar_hidden', 'user_fullname', 'user_initials', 'app_name', 'app_logo'],
    computed: {
        logo_initial() {
            return this.app_name ? this.app_name.charAt(0).toUpperCase() : 'M';
        }
    },
    methods: {
        toggleHide() {
            this.$emit('toggle-hide');
        }
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
