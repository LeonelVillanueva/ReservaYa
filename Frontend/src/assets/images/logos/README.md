# Logos (importados en componentes)

Coloca aquí los logos que quieras **importar** en tus componentes Vue.

**Ejemplo de uso:**

```vue
<script setup>
import logoMesa from '@/assets/images/logos/logo-mesa.svg'
</script>

<template>
  <img :src="logoMesa" alt="MesaSegura" />
</template>
```

Vite procesa estos archivos (optimización, hash en build). Úsalo cuando el logo forme parte del código de un componente.
