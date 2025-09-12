## Check de Modelos y Cobertura (Backend)

Convención:
- [x] = Solo modelo (db.Model)
- [x][x] = Modelo + servicios + rutas + endpoints

### Entidades
- Area — [x][x]
- Usuario — [x][x]
- Rol — [x][x]
- Permiso — [x][x]
- Contacto — [x][x]
- Direccion — [x][x]
  - Comuna — [x]
  - Ciudad — [x]
  - Region — [x]
  - Pais — [x]
- TipoCliente — [x][x]
- SegmentoCliente — [x][x]
- ListaPrecios — [x][x]
- CondicionPago — [x][x]
- Empresa — [x][x]
- MaestroClientes — [x][x]
- MaestroProveedores — [x]
- TipoNegocio — [x]
- UsuarioB2B — [x]
- Equipo — [x]

### Negocio
- CanalVenta — [x][x]
- Vendedor — [x][x]
- TipoMeta — [x]
- Meta — [x]
- TipoRegla — [x]
- MotorReglasComerciales — [x]

### Productos
- Fabrica — [x]
- Origen — [x]
- MaestroProductos — [x]
- ProductoProveedor — [x]
- Calidad — [x]
- CodigoReferencia — [x]
- CodigoTecnico — [x]
- Aplicacion — [x]
- Modelo (vehículo) — [x]
- VersionVehiculo — [x]
- Marca — [x]
- Categoria — [x]
- SubCategoria — [x]
- MaestroOfertas — [x]

### Soporte
- BaseConocimiento — [x]
- Instalacion — [x]
- Caso — [x]
- TipoCaso — [x]

### Analítica
- HistorialCambios — [x]
- ClienteMetricas — [x]
- ClienteMetricasCanal — [x]
- ClienteMetricasMarca — [x]
- ClienteActividad — [x]
- ClienteMetricasMensuales — [x]

---

### Posibles modelos faltantes (core importación/venta/distribución de repuestos)

- OrdenCompra (a proveedores) — Para registrar compras, estados y recepciones parciales.
- RecepcionCompra / DetalleRecepcion — Para trazabilidad de ingreso físico a bodega.
- Bodega / Ubicacion — Para gestión multi-almacén y slotting de inventario.
- Inventario / Lote / Serie — Para stock por bodega, control de lotes/series y costos.
- MovimientoInventario — Para entradas/salidas/ajustes con motivo y referencia.
- PedidoVenta / DetallePedido — Para canalizar ventas desde cotización hasta despacho.
- CotizacionVenta — Etapa previa a pedido con vigencias y aprobaciones.
- Despacho / GuiaDespacho — Para preparar picking/packing y transporte.
- Transportista / TarifaFlete — Para costos y asignación de envíos.
- FacturaProveedor / NotaCreditoProveedor — Para conciliación de compras y contabilidad.
- FacturaCliente / NotaCreditoCliente — Para facturación y devoluciones de venta.
- PagoCliente / Cobranza — Para registrar pagos, estados y conciliaciones.
- DevolucionCliente / RMA — Para retorno de productos y reincorporación/merma.
- ListaPreciosDetalle / ReglaPrecio — Para precios por producto, canal, segmento y promociones.
- Sucursal / PuntoVenta — Para operaciones físicas y asignación de stock.
- ParametroImpuesto / IVA / Exencion — Para tratamiento fiscal por producto/cliente.

### Por qué son necesarios
- Visión de punta a punta: compra → recepción → stock → venta → despacho → facturación → pago.
- Control de stock y costos: sin inventario y movimientos no hay trazabilidad ni valorización.
- Ciclo comercial completo: pedidos, cotizaciones, devoluciones y cobranzas son críticos.
- Cumplimiento fiscal: facturas/notas de crédito e impuestos son obligatorios.
- Operación logística: bodegas, ubicaciones y transportistas soportan distribución eficiente.


