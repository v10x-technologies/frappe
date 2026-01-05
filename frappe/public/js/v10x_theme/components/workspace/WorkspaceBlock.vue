<template>
  <div :class="col_class">
    <div class="v10x-block-wrapper">
      <div v-if="block.type === 'chart'" class="chart-block">
        <ChartWidget :chart_data="block.data" />
      </div>
      <div v-else-if="block.type === 'shortcuts'" class="shortcuts-block">
        <ShortcutWidget :shortcuts="block.data" />
      </div>
      <div v-else-if="block.type === 'card'" class="card-block h-100">
        <CardWidget :card_data="block.data" />
      </div>
      <div v-else-if="block.type === 'number_cards'" class="number-cards-block">
        <!-- Number cards can be rendered as a group for better layout -->
        <div class="row g-3">
            <div v-for="(card, i) in block.data" :key="i" class="col-12 col-md-3">
                <div class="number-card shadow-sm p-3 bg-white rounded-lg border">
                    <div class="text-muted small font-weight-bold mb-1">{{ card.label }}</div>
                    <div class="h4 mb-0 font-weight-bold">{{ card.value || '0' }}</div>
                </div>
            </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ChartWidget from './ChartWidget.vue';
import ShortcutWidget from './ShortcutWidget.vue';
import CardWidget from './CardWidget.vue';

export default {
    name: 'WorkspaceBlock',
    components: {
        ChartWidget,
        ShortcutWidget,
        CardWidget
    },
    props: {
        block: {
            type: Object,
            required: true
        },
        page_data: {
            type: Object,
            required: true
        }
    },
    computed: {
        col_class() {
            const col = this.block.col || 12;
            return `col-12 col-md-${col}`;
        }
    }
};
</script>

<style scoped>
.v10x-block-wrapper {
    height: 100%;
}
.number-card {
    border: 1px solid #f1f5f9;
    transition: transform 0.2s ease;
}
.number-card:hover {
    transform: translateY(-2px);
}
.rounded-lg { border-radius: 12px; }
</style>
