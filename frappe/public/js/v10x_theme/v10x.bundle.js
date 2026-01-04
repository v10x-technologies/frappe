import { createApp } from 'vue';
import V10xShell from './v10x_shell.vue';

// Wait for Frappe to initialize
$(document).on('app_ready', function() {
    // 1. Check if we should load the shell (e.g. not in setup wizard)
    if (frappe.boot.setup_complete) {
        initV10xShell();
    }
});

function initV10xShell() {
    console.log("🚀 V10x Theme: Initializing Shell...");

    // 2. Hide default Elements that Frappe rendered
    $('body').addClass('v10x-theme-enabled');
    
    // Inject our root element for Vue
    if ($('#v10x-root').length === 0) {
        $('<div id="v10x-root"></div>').prependTo('body');
    }

    // 3. Mount Vue App
    const app = createApp(V10xShell);
    app.mount('#v10x-root');

    // 4. Force override specific Frappe UI behaviors
    $('body').attr('data-theme', 'v10x'); 
}
