<template>
  <div class="v10x-workspace-container" v-if="page_data">
    <div class="workspace-scroll-area">
      <div class="workspace-header mb-4 px-4 pt-4 d-none">
        <h2 class="workspace-title">{{ page_title }}</h2>
      </div>

      <div class="workspace-content px-4 pb-4">
        <div class="row gx-4 gy-4">
          <template v-for="(block, index) in blocks" :key="index">
            <WorkspaceBlock :block="block" :page_data="page_data" />
          </template>
        </div>
      </div>
    </div>
  </div>
  <div v-else-if="loading" class="workspace-loading d-flex justify-content-center align-items-center">
    <div class="spinner-border text-primary" role="status">
      <span class="visually-hidden">Loading...</span>
    </div>
  </div>
</template>

<script>
import WorkspaceBlock from './WorkspaceBlock.vue';

export default {
    name: 'V10xWorkspace',
    components: {
        WorkspaceBlock
    },
    props: {
        workspace_name: {
            type: String,
            required: true
        },
        is_public: {
            type: Boolean,
            default: true
        }
    },
    data() {
        return {
            page_data: null,
            loading: true,
            page_title: '',
            blocks: []
        };
    },
    watch: {
        workspace_name: {
            handler: 'fetch_data',
            immediate: true
        }
    },
    methods: {
        async fetch_data() {
            if (!this.workspace_name) return;
            
            console.log(`[V10x] Workspace: Fetching data for ${this.workspace_name}`);
            this.loading = true;
            this.page_data = null;
            
            try {
                const response = await frappe.call({
                    method: 'frappe.desk.desktop.get_desktop_page',
                    args: {
                        page: JSON.stringify({
                            name: this.workspace_name,
                            public: this.is_public ? 1 : 0
                        })
                    }
                });

                if (response.message) {
                    console.log(`[V10x] Workspace: Received data`, response.message);
                    this.page_data = response.message;
                    this.page_title = this.workspace_name;
                    this.process_blocks();
                }
            } catch (e) {
                console.error("[V10x] Workspace: Error fetching data", e);
            } finally {
                this.loading = false;
            }
        },
        process_blocks() {
            let all_blocks = [];

            // 1. Charts
            if (this.page_data.charts?.items?.length) {
                this.page_data.charts.items.forEach(chart => {
                    all_blocks.push({ type: 'chart', data: chart, col: 6 });
                });
            }

            // 2. Number Cards (New)
            if (this.page_data.number_cards?.items?.length) {
                 all_blocks.push({ type: 'number_cards', data: this.page_data.number_cards.items, col: 12 });
            }

            // 3. Shortcuts
            if (this.page_data.shortcuts?.items?.length) {
                all_blocks.push({ type: 'shortcuts', data: this.page_data.shortcuts.items, col: 12 });
            }

            // 4. Cards (Links)
            if (this.page_data.cards?.items?.length) {
                this.page_data.cards.items.forEach(card => {
                    all_blocks.push({ type: 'card', data: card, col: card.col || 4 });
                });
            }

            this.blocks = all_blocks;
            console.log(`[V10x] Workspace: Processed ${all_blocks.length} blocks`);
        }
    }
};
</script>

<style scoped>
.v10x-workspace-container {
    width: 100%;
    height: 100%;
    background-color: transparent;
}

.workspace-scroll-area {
    height: 100%;
    overflow-y: visible;
    overflow-x: hidden;
}

.workspace-title {
    font-weight: 800;
    color: #0f172a;
    font-size: 1.75rem;
    letter-spacing: -0.02em;
}

.workspace-loading {
    height: 300px;
    width: 100%;
}
</style>
