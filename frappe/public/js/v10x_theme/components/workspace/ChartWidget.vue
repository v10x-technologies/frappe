<template>
  <div class="chart-widget-v10x h-100">
    <div class="p-3 border-bottom d-flex justify-content-between align-items-center">
      <h6 class="mb-0 font-weight-bold text-dark">{{ chart_data.label }}</h6>
    </div>
    <div class="p-3">
      <div ref="chart_container" class="chart-container" style="min-height: 240px;"></div>
    </div>
  </div>
</template>

<script>
export default {
    name: 'ChartWidget',
    props: {
        chart_data: {
            type: Object,
            required: true
        }
    },
    mounted() {
        this.render_chart();
    },
    methods: {
        render_chart() {
            if (!this.chart_data || !this.chart_data.chart_name) return;
            
            console.log(`[V10x] Chart: Rendering ${this.chart_data.chart_name}`);
            
            // Integrate with Frappe's DashboardChart
            this.chart = new frappe.ui.DashboardChart({
                parent: this.$refs.chart_container,
                chart_name: this.chart_data.chart_name,
            });
        }
    },
    beforeUnmount() {
        if (this.chart && this.chart.destroy) {
            this.chart.destroy();
        }
    }
};
</script>

<style scoped>
.chart-widget-v10x {
    background: #ffffff;
    border: 1px solid #f1f5f9;
    border-radius: 16px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.03);
    overflow: hidden;
}
.chart-container {
    width: 100%;
}
.font-weight-bold {
    font-weight: 700 !important;
}
</style>
