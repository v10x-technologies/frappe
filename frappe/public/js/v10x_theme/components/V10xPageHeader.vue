<template>
  <div class="v10x-page-header" v-show="show">
    <div class="header-container d-flex align-items-center justify-content-between px-4 py-2">
      <div class="page-title-area d-flex align-items-center">
          <!-- Unified Portal for Breadcrumbs and Title -->
          <div id="v10x-page-title-portal" class="d-flex align-items-center"></div>
      </div>
        
        <div class="page-actions-area d-flex align-items-center gap-2">
            <!-- Placeholder for teleported custom actions -->
            <div id="v10x-custom-actions-portal" class="d-flex align-items-center gap-2"></div>
            
            <!-- Ellipsis / More Actions portal -->
            <div id="v10x-more-actions-portal" class="d-flex align-items-center"></div>

            <!-- Placeholder for teleported standard actions -->
            <div id="v10x-standard-actions-portal" class="d-flex align-items-center gap-2"></div>
        </div>
      </div>
    </div>
</template>

<script>
export default {
    name: 'V10xPageHeader',
    props: {
        show: {
            type: Boolean,
            default: true
        }
    }
};
</script>

<style scoped>
.v10x-page-header {
    background: #fff;
    border-bottom: 1px solid var(--border-color);
    margin-bottom: 0;
    z-index: 100;
    position: sticky;
    top: 70px; /* Sits below the main V10x header */
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); /* Added slight shadow to distinguish when sticky */
}

.header-container {
    min-height: 50px;
}

#v10x-page-title-portal {
    font-size: 13px;
    gap: 12px;
}

/* Breadcrumb Styling */
:deep(#navbar-breadcrumbs) {
    display: flex;
    list-style: none;
    padding: 0;
    margin: 0;
    gap: 8px;
    align-items: center;
}

:deep(#navbar-breadcrumbs li) {
    display: flex;
    align-items: center;
}

:deep(#navbar-breadcrumbs li::after) {
    content: '>';
    margin-left: 8px;
    color: var(--text-muted);
    font-size: 10px;
    opacity: 0.5;
}

:deep(#navbar-breadcrumbs li:last-child::after) {
    content: '>';
}

:deep(#navbar-breadcrumbs a) {
    color: var(--text-muted);
    text-decoration: none;
    font-weight: 400;
    font-size: 13px;
    transition: color 0.2s;
}

:deep(#navbar-breadcrumbs a:hover) {
    color: var(--primary);
}

/* Title Styling */
:deep(.title-area) {
    display: flex;
    align-items: center;
}

:deep(.title-text) {
    font-size: 16px;
    font-weight: 700;
    color: var(--heading-color);
    letter-spacing: -0.01em;
}

:deep(.indicator-pill) {
    margin-left: 10px;
    padding: 3px 10px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

:deep(.btn) {
    border-radius: 6px;
    font-weight: 600;
    padding: 7px 15px;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s;
}

:deep(.btn-primary) {
    background-color: var(--primary);
    border-color: var(--primary);
}

:deep(.btn-primary:hover) {
    background-color: #0086d1;
    border-color: #0086d1;
}

:deep(.btn-default), :deep(.btn-secondary) {
    background-color: #f1faff;
    border-color: #f1faff;
    color: var(--primary);
}

:deep(.btn-default:hover), :deep(.btn-secondary:hover) {
    background-color: var(--primary);
    border-color: var(--primary);
    color: #fff;
}

/* Ensure Frappe dropdown menus play nice */
:deep(.dropdown-menu) {
    border: 1px solid var(--border-color);
    box-shadow: 0 10px 40px rgba(0,0,0,0.08);
    border-radius: 10px;
    padding: 6px;
    z-index: 3001;
}

:deep(.dropdown-item) {
    border-radius: 6px;
    padding: 8px 12px;
    font-size: 13px;
    color: var(--text-color);
}

:deep(.dropdown-item:hover) {
    background-color: var(--primary-light);
    color: var(--primary);
}
</style>
