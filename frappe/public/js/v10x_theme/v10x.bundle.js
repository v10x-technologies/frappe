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

    // 1. Mark body as themed
    $('body').addClass('v10x-theme-enabled');
    
    // 2. Inject our root element for Vue if missing
    if ($('#v10x-root').length === 0) {
        $('<div id="v10x-root"></div>').prependTo('body');
    }

    // 3. Mount Vue App
    const app = createApp(V10xShell);
    window.v10x_shell = app.mount('#v10x-root');

    // 4. THE PORTAL: Move original Frappe #body into our shell
    let attempts = 0;
    const portalInterval = setInterval(() => {
        const $frappeBody = $('#body');
        const $portal = $('#v10x-body-portal');
        
        if ($frappeBody.length && $portal.length) {
            console.log("📦 V10x Theme: Portaling Frappe #body...");
            
            $frappeBody.appendTo($portal);
            
            // Hide the original wrapper completely
            $('.main-section').hide();
            
            clearInterval(portalInterval);
        }
        
        if (attempts++ > 20) clearInterval(portalInterval);
    }, 100);

    // 5. Force override specific Frappe UI behaviors
    $('body').attr('data-theme', 'v10x'); 
}
