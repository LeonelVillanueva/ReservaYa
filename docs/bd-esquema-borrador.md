# Borrador de esquema de base de datos — Sistema de reservas de restaurante

> Contenido de cada tabla según el análisis del sistema.

---

## 1. Usuarios y clientes

### Tabla: usuarios

| Columna      | Tipo         | Restricciones      | Descripción                |
|--------------|--------------|--------------------|----------------------------|
| id           | INT          | PK, AUTO_INCREMENT | Identificador único        |
| email        | VARCHAR(255) | UK, NN             | Correo de acceso           |
| password_hash| VARCHAR(255) | NN                 | Contraseña hasheada        |
| nombre       | VARCHAR(100) | NN                 | Nombre                     |
| apellido     | VARCHAR(100) | NN                 | Apellido                   |
| telefono     | VARCHAR(20)  |                    | Teléfono de contacto       |
| rol_id       | INT          | FK                 | Rol del usuario            |
| activo       | BOOLEAN      | DEFAULT TRUE       | Cuenta activa              |
| creado_en    | TIMESTAMP    | DEFAULT NOW()      | Fecha de registro          |
| actualizado_en| TIMESTAMP   | ON UPDATE NOW()    | Última actualización       |

---

### Tabla: roles

> **Roles del sistema:** `manager`, `cliente`, `agente_ia`.  
> El agente de IA tiene un registro en `usuarios` con rol `agente_ia`; el backend lo usa al procesar reservas del asistente virtual. Permite auditoría y permisos acotados.

| Columna  | Tipo         | Restricciones      | Descripción                              |
|----------|--------------|--------------------|------------------------------------------|
| id       | INT          | PK, AUTO_INCREMENT | Identificador                            |
| nombre   | VARCHAR(50)  | UK, NN             | manager, cliente, agente_ia              |

---

### Tabla: perfiles_cliente

> Solo se usa para usuarios con rol **cliente** (fidelización, preferencias, alergias en contexto).

| Columna            | Tipo         | Restricciones | Descripción                    |
|--------------------|--------------|---------------|--------------------------------|
| id                 | INT          | PK            | Identificador                  |
| usuario_id         | INT          | FK, UK        | Usuario al que pertenece       |
| fecha_nacimiento   | DATE         |               | Para beneficios/fidelización   |
| preferencias       | TEXT         |               | Notas alimentarias generales   |
| notas              | TEXT         |               | Observaciones del cliente      |

---

### Tabla: alergias

> **Catálogo predefinido.** Listado de alergias alimentarias cargado por el sistema/admin.  
> El usuario no crea alergias nuevas; selecciona de este listado al registrar sus alergias.

| Columna     | Tipo         | Restricciones      | Descripción                        |
|-------------|--------------|--------------------|------------------------------------|
| id          | INT          | PK, AUTO_INCREMENT | Identificador                      |
| nombre      | VARCHAR(100) | UK, NN             | Ej: gluten, lactosa, frutos secos  |
| descripcion | TEXT         |                    | Detalle de la alergia / alérgenos  |

---

### Tabla: usuario_alergia

> El usuario registra a qué es alérgico eligiendo del listado de `alergias`.

| Columna    | Tipo | Restricciones | Descripción                              |
|------------|------|---------------|------------------------------------------|
| usuario_id | INT  | FK, PK        | Usuario que registra la alergia          |
| alergia_id | INT  | FK, PK        | Alergia elegida del catálogo predefinido |

---

## 2. Reservas

### Tabla: reservas

> **Anticipo obligatorio:** Para confirmar la reserva se exige el pago de un anticipo. El monto lo define el manager en su panel de configuraciones. Si el cliente no se presenta (no-show), el restaurante retiene el anticipo. Si asiste, el anticipo se descuenta de la cuenta final (total consumido − anticipo = lo que paga al salir).

| Columna          | Tipo         | Restricciones  | Descripción                              |
|------------------|--------------|----------------|------------------------------------------|
| id               | INT          | PK             | Identificador                            |
| usuario_id       | INT          | FK, NN         | Cliente para quien es la reserva         |
| creado_por_id    | INT          | FK, NN         | Quién la creó: cliente, manager o agente_ia |
| mesa_id          | INT          | FK             | Mesa asignada (si aplica)                |
| fecha            | DATE         | NN             | Fecha de la reserva                      |
| hora             | TIME         | NN             | Hora de la reserva                       |
| cantidad_personas   | INT          | NN             | Número de comensales                     |
| duracion_estimada_minutos| INT      |                | Minutos estimados (para disponibilidad y asignación de mesa) |
| estado_id        | INT          | FK, NN         | Estado actual                            |
| pago_anticipo_id | INT          | FK, NN         | Pago del anticipo (requerido para confirmar) |
| notas            | TEXT         |                | Indicaciones especiales                  |
| creado_en        | TIMESTAMP    | DEFAULT NOW()  | Fecha de creación                        |
| actualizado_en   | TIMESTAMP    | ON UPDATE NOW()| Última modificación                      |

---

### Tabla: estados_reserva

| Columna  | Tipo         | Restricciones      | Descripción              |
|----------|--------------|--------------------|--------------------------|
| id       | INT          | PK, AUTO_INCREMENT | Identificador            |
| nombre   | VARCHAR(50)  | UK, NN             | pendiente, confirmada, cancelada, completada, no_show |

---

### Tabla: pagos

> **Tipos:** `anticipo` = depósito al reservar (monto definido por el manager en configuraciones); `cuenta_final` = cobro al salir (total consumido − anticipo aplicado).  
> Una reserva puede tener 2 pagos: anticipo (obligatorio) y cuenta_final (solo si el cliente se presenta y consume).

| Columna          | Tipo           | Restricciones  | Descripción                              |
|------------------|----------------|----------------|------------------------------------------|
| id               | INT            | PK             | Identificador                            |
| reserva_id       | INT            | FK, NN         | Reserva asociada                         |
| tipo             | VARCHAR(20)    | NN             | anticipo, cuenta_final                   |
| monto            | DECIMAL(10,2)  | NN             | Anticipo: depósito pagado. Cuenta_final: monto cobrado (ya descontado anticipo) |
| anticipo_aplicado| DECIMAL(10,2)  | DEFAULT 0      | Solo cuenta_final: anticipo descontado   |
| metodo_pago_id   | INT            | FK             | Forma de pago                            |
| estado           | VARCHAR(50)    | NN             | completado, pendiente, etc.              |
| referencia       | VARCHAR(100)   |                | ID transacción externa                   |
| fecha_pago       | TIMESTAMP      |                | Fecha del pago                           |

> Para cuenta_final: monto_total_consumido = monto + anticipo_aplicado.  
> **Restricción sugerida:** UNIQUE(reserva_id, tipo) — una reserva solo puede tener un pago tipo anticipo y uno tipo cuenta_final.

---

### Flujo de pagos

| Escenario | Anticipo | Cuenta final |
|-----------|----------|--------------|
| **No-show** | Se queda el restaurante. No se crea pago cuenta_final | — |
| **Cliente asiste** | Se descuenta del total | Cliente paga: total_consumido − anticipo |

---

### Tabla: metodos_pago

| Columna  | Tipo         | Restricciones      | Descripción     |
|----------|--------------|--------------------|-----------------|
| id       | INT          | PK, AUTO_INCREMENT | Identificador   |
| nombre   | VARCHAR(50)  | NN                 | tarjeta, efectivo, transferencia |

---

## 3. Mesas

### Tabla: mesas

| Columna     | Tipo          | Restricciones  | Descripción                    |
|-------------|---------------|----------------|--------------------------------|
| id          | INT           | PK             | Identificador                  |
| numero_mesa | VARCHAR(20)   | UK, NN         | Número o código de mesa (único)|
| capacidad   | INT           | NN             | Personas que caben             |
| posicion_x  | DECIMAL(5,2)  |                | Coordenada para mapa visual    |
| posicion_y  | DECIMAL(5,2)  |                | Coordenada para mapa visual    |
| activa      | BOOLEAN       | DEFAULT TRUE   | Disponible para uso            |

---

### Tabla: asignaciones_mesa

> **Regla de negocio:** Una misma mesa no debe tener asignaciones con horarios solapados el mismo día (evitar overbooking). Validar en aplicación o con constraint/trigger.

| Columna     | Tipo      | Restricciones  | Descripción                    |
|-------------|-----------|----------------|--------------------------------|
| id          | INT       | PK             | Identificador                  |
| reserva_id  | INT       | FK, NN         | Reserva asociada               |
| mesa_id     | INT       | FK, NN         | Mesa asignada                  |
| fecha       | DATE      | NN             | Fecha de la asignación         |
| hora_inicio | TIME      | NN             | Inicio del uso                 |
| hora_fin    | TIME      | NN             | Fin del uso                    |
| estado      | VARCHAR(50)| NN            | ocupada, liberada, etc.        |

---

## 4. Menú — categorías y platos

### Tabla: categorias_plato

| Columna     | Tipo         | Restricciones  | Descripción                  |
|-------------|--------------|----------------|------------------------------|
| id          | INT          | PK             | Identificador                |
| nombre      | VARCHAR(100) | NN             | entradas, principales, etc.  |
| descripcion | TEXT         |                | Descripción de la categoría  |
| orden       | INT          |                | Orden de visualización       |

---

### Tabla: platos

| Columna    | Tipo           | Restricciones  | Descripción               |
|------------|----------------|----------------|---------------------------|
| id         | INT            | PK             | Identificador             |
| categoria_id| INT           | FK, NN         | Categoría del plato       |
| nombre     | VARCHAR(200)   | NN             | Nombre del plato          |
| descripcion| TEXT           |                | Descripción/elaboración   |
| precio     | DECIMAL(10,2)  | NN             | Precio                    |
| disponible | BOOLEAN        | DEFAULT TRUE   | Si está en menú activo (ej. existencias agotadas) |
| imagen_url | VARCHAR(500)   |                | URL de imagen             |
| actualizado_en| TIMESTAMP   | ON UPDATE NOW()| Última modificación (menú actualizado) |

---

### Tabla: ingredientes

| Columna     | Tipo         | Restricciones      | Descripción                  |
|-------------|--------------|--------------------|------------------------------|
| id          | INT          | PK, AUTO_INCREMENT | Identificador                |
| nombre      | VARCHAR(100) | UK, NN             | Nombre del ingrediente       |
| es_alergeno | BOOLEAN      | DEFAULT FALSE      | Si es alérgeno común         |

---

### Tabla: plato_ingrediente

| Columna      | Tipo | Restricciones | Descripción              |
|--------------|------|---------------|--------------------------|
| plato_id     | INT  | FK, PK        | Plato                    |
| ingrediente_id| INT | FK, PK        | Ingrediente del plato    |
| cantidad     | VARCHAR(50) |             | Opcional: proporción/uni  |

---

## 5. Pedidos (coordinación cocina)

### Tabla: pedidos

> **reserva_id** puede ser NULL para consumos sin reserva (walk-in). Si hay reserva, usuario = reserva.usuario_id.

| Columna    | Tipo      | Restricciones  | Descripción             |
|------------|-----------|----------------|-------------------------|
| id         | INT       | PK             | Identificador           |
| reserva_id | INT       | FK             | Reserva asociada (NULL si walk-in) |
| mesa_id    | INT       | FK, NN         | Mesa del pedido         |
| estado     | VARCHAR(50)| NN            | recibido, en_preparacion, servido |
| notas      | TEXT      |                | Notas generales         |
| creado_en  | TIMESTAMP | DEFAULT NOW()  | Fecha del pedido        |

---

### Tabla: pedido_detalle

| Columna      | Tipo         | Restricciones | Descripción                 |
|--------------|--------------|---------------|-----------------------------|
| id           | INT          | PK            | Identificador               |
| pedido_id    | INT          | FK, NN        | Pedido al que pertenece     |
| plato_id     | INT          | FK, NN        | Plato pedido                |
| cantidad     | INT          | NN            | Cantidad                    |
| observaciones| TEXT         |               | Sin X, extra Y, etc.        |
| precio_unitario| DECIMAL(10,2)|              | Precio al momento del pedido|

---

## 6. Inventario

### Tabla: productos

| Columna       | Tipo         | Restricciones  | Descripción            |
|---------------|--------------|----------------|------------------------|
| id            | INT          | PK             | Identificador          |
| nombre        | VARCHAR(200) | NN             | Nombre del producto    |
| unidad        | VARCHAR(20)  | NN             | kg, litros, unidades   |
| stock_minimo  | DECIMAL(10,2)|                | Umbral de alerta       |

---

### Tabla: stock

> **Unicidad:** UNIQUE(producto_id, ubicacion) — un producto tiene una fila por ubicación. Stock total = suma por producto. Comparar con productos.stock_minimo para avisos de existencias agotadas.

| Columna    | Tipo          | Restricciones | Descripción            |
|------------|---------------|---------------|------------------------|
| id         | INT           | PK            | Identificador          |
| producto_id| INT           | FK, NN        | Producto               |
| cantidad   | DECIMAL(10,2) | NN            | Cantidad disponible    |
| ubicacion  | VARCHAR(100)  | NN            | Almacén, cocina, etc.  |
| actualizado_en| TIMESTAMP   |               | Última actualización   |

---

### Tabla: movimientos_stock

| Columna     | Tipo          | Restricciones | Descripción              |
|-------------|---------------|---------------|--------------------------|
| id          | INT           | PK            | Identificador            |
| producto_id | INT           | FK, NN        | Producto afectado        |
| tipo        | VARCHAR(50)   | NN            | entrada, salida, ajuste  |
| cantidad    | DECIMAL(10,2) | NN            | Cantidad del movimiento  |
| fecha       | TIMESTAMP     | DEFAULT NOW() | Fecha del movimiento     |
| referencia  | VARCHAR(100)  |               | Pedido, compra, etc.     |

---

## 7. Fidelización

### Tabla: puntos_usuario

> Saldo del cliente = suma de `puntos` por usuario_id. En canjes, puntos &lt; 0 y **beneficio_id** indica qué beneficio canjeó.

| Columna    | Tipo      | Restricciones  | Descripción                |
|------------|-----------|----------------|----------------------------|
| id         | INT       | PK             | Identificador              |
| usuario_id | INT       | FK, NN         | Usuario                    |
| puntos     | INT       | NN             | Puntos a sumar (positivo) o restar (negativo en canje) |
| tipo       | VARCHAR(50)| NN            | reserva, canje, promocion  |
| beneficio_id| INT      | FK             | Solo si tipo = canje        |
| referencia | VARCHAR(100)|               | ID de reserva/pedido, etc. |
| fecha      | TIMESTAMP | DEFAULT NOW()  | Fecha del movimiento       |

---

### Tabla: beneficios

| Columna     | Tipo           | Restricciones | Descripción            |
|-------------|----------------|---------------|------------------------|
| id          | INT            | PK            | Identificador          |
| nombre      | VARCHAR(200)   | NN            | Nombre del beneficio   |
| puntos_requeridos| INT       | NN            | Puntos para canjear    |
| descripcion | TEXT           |               | Detalle del beneficio  |
| activo      | BOOLEAN        | DEFAULT TRUE  | Disponible             |

---

## 8. Notificaciones y configuración

### Tabla: notificaciones

> **reserva_id** opcional: enlaza recordatorios/confirmaciones a la reserva concreta.

| Columna    | Tipo         | Restricciones  | Descripción               |
|------------|--------------|----------------|---------------------------|
| id         | INT          | PK             | Identificador             |
| usuario_id | INT          | FK, NN         | Destinatario              |
| reserva_id | INT          | FK             | Reserva relacionada (recordatorio, confirmación) |
| tipo       | VARCHAR(50)  | NN             | recordatorio, confirmacion, aviso |
| titulo     | VARCHAR(200) |                | Asunto                    |
| contenido  | TEXT         |                | Cuerpo del mensaje        |
| leida      | BOOLEAN      | DEFAULT FALSE  | Si fue leída              |
| fecha_envio| TIMESTAMP    | DEFAULT NOW()  | Fecha de envío            |

---

### Tabla: horarios_restaurante

| Columna       | Tipo   | Restricciones | Descripción           |
|---------------|--------|---------------|------------------------|
| id            | INT    | PK            | Identificador         |
| dia_semana    | INT    | NN            | 0=Dom, 1=Lun, ... 6=Sab |
| hora_apertura | TIME   | NN            | Hora de apertura      |
| hora_cierre   | TIME   | NN            | Hora de cierre        |
| activo        | BOOLEAN| DEFAULT TRUE  | Si aplica ese día     |

---

### Tabla: parametros

| Columna  | Tipo         | Restricciones | Descripción              |
|----------|--------------|---------------|--------------------------|
| clave    | VARCHAR(100) | PK            | Nombre del parámetro     |
| valor    | TEXT         |               | Valor configurable       |

> Ejemplos: `monto_anticipo` (manager), `horas_anticipo_cancelacion` (ej. 24), `devolver_anticipo_si_cancela` (true/false), `dias_anticipo_reserva_max` (límite para reservar).

---

## Relaciones principales

| Desde        | Hacia           | Tipo        |
|--------------|-----------------|-------------|
| usuarios     | roles           | N:1         |
| usuarios     | perfiles_cliente| 1:1         |
| usuarios     | usuario_alergia | N:M (vía tabla) |
| alergias     | usuario_alergia | N:M (vía tabla) |
| usuarios     | reservas        | 1:N (usuario_id: cliente) |
| usuarios     | reservas        | 1:N (creado_por_id: quién creó la reserva) |
| reservas     | estados_reserva | N:1         |
| reservas     | pagos           | 1:N (anticipo + cuenta_final) |
| reservas     | asignaciones_mesa| 1:N         |
| platos       | categorias_plato| N:1         |
| platos       | plato_ingrediente| N:M (vía tabla) |
| ingredientes | plato_ingrediente| N:M (vía tabla) |
| reservas     | pedidos         | 1:N         |
| pedidos      | pedido_detalle  | 1:N         |
| platos       | pedido_detalle  | N:1         |
| reservas     | notificaciones  | 1:N (recordatorios) |
| usuarios     | puntos_usuario  | 1:N         |
| beneficios   | puntos_usuario  | N:1 (cuando tipo = canje) |

---

## Datos iniciales — roles

| id | nombre   |
|----|----------|
| 1  | manager  |
| 2  | cliente  |
| 3  | agente_ia|

> Crear un usuario sistema en `usuarios` con `rol_id = 3` (ej. `asistente@restaurante.local`) para que el backend lo use al procesar acciones del agente de IA.

---

## Notas

- **PK** = Primary Key  
- **FK** = Foreign Key  
- **UK** = Unique  
- **NN** = NOT NULL  
- **Total: 26 tablas**

---

## Revisión del esquema — posibles mejoras

### Cubierto por el doc.txt

| Requisito | Cómo se cubre |
|-----------|----------------|
| Reservas anticipadas, control de espacio | reservas, asignaciones_mesa, mesas |
| Anticipo obligatorio, reducción no-show | pagos (tipo anticipo), pago_anticipo_id en reservas |
| Mapa visual mesas, evitar overbooking | mesas (posicion_x/y), asignaciones_mesa, regla de no solapamiento |
| Menú actualizado, avisos existencias | platos.disponible, platos.actualizado_en; stock vs productos.stock_minimo |
| Alergias del cliente | alergias, usuario_alergia, plato_ingrediente + ingredientes.es_alergeno |
| Coordinación cocina | pedidos, pedido_detalle, estados de pedido |
| Fidelización, historial, beneficios | puntos_usuario, beneficios, reservas (historial) |
| Recordatorios, notificaciones | notificaciones (reserva_id para recordatorios) |
| Modificación/cancelación reserva | reservas.actualizado_en, estados_reserva (cancelada) |
| Configuración manager | parametros (monto_anticipo, políticas cancelación) |

### Mejoras aplicadas en este borrador

- **reservas:** `duracion_estimada_minutos` para disponibilidad y hora_fin de asignaciones.
- **mesas:** `numero_mesa` UK para evitar duplicados.
- **pagos:** Nota UNIQUE(reserva_id, tipo).
- **asignaciones_mesa:** `hora_fin` NN y nota sobre no solapamiento de mesas.
- **platos:** `actualizado_en` y `disponible` ligado a existencias.
- **stock:** UNIQUE(producto_id, ubicacion), ubicacion NN.
- **pedidos:** `reserva_id` nullable para walk-ins.
- **puntos_usuario:** `beneficio_id` FK para canjes.
- **notificaciones:** `reserva_id` para enlazar recordatorios.
- **parametros:** Ejemplos de políticas (cancelación, anticipo).

### Opcional para más adelante

- **Política de cancelación:** tabla o parametros (devolver anticipo si cancela antes de X horas).
- **Especiales del día:** tabla `platos_especiales` (plato_id, fecha, precio_especial) o columna en platos.
- **Recetas / consumo de inventario:** tabla plato_producto (plato → productos y cantidades) para descontar stock al hacer pedidos y avisos automáticos de “plato no disponible”.
- **Auditoría:** tabla audit_log (quién cambió qué y cuándo).
- **Historial de cambios de reserva:** tabla reserva_historial si se necesita trazabilidad completa de modificaciones.
