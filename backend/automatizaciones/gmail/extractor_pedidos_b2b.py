# extractor_pedidos_b2b.py

import os
import base64
import re
import io
import pdfplumber
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
from sqlalchemy.orm import Session
from typing import Optional, Dict, List, Tuple

# Si el archivo token.json existe, lo carga.
# Si no, inicia el flujo de autenticación y lo crea.
SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']

# Rutas para credenciales (relativas a este archivo)
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
CREDENTIALS_PATH = os.path.join(CURRENT_DIR, 'credentials.json')
TOKEN_PATH = os.path.join(CURRENT_DIR, 'token.json')


def autenticar_gmail():
    """Autentica con la API de Gmail y devuelve el servicio."""
    creds = None
    if os.path.exists(TOKEN_PATH):
        creds = Credentials.from_authorized_user_file(TOKEN_PATH, SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists(CREDENTIALS_PATH):
                raise FileNotFoundError(
                    f"No se encontró el archivo credentials.json en {CREDENTIALS_PATH}. "
                    "Por favor, coloca tu archivo credentials.json en la carpeta backend/automatizaciones/gmail/"
                )
            flow = InstalledAppFlow.from_client_secrets_file(
                CREDENTIALS_PATH, SCOPES)
            creds = flow.run_local_server(port=0)
        with open(TOKEN_PATH, 'w') as token:
            token.write(creds.to_json())
    return build('gmail', 'v1', credentials=creds)


def extraer_campo(texto, patron, default=''):
    """Extrae un campo del texto usando una expresión regular."""
    match = re.search(patron, texto)
    return match.group(1).strip() if match else default


def guardar_pdf_extraido(pdf_data: bytes, codigo_b2b: str, fecha_correo: datetime) -> Optional[str]:
    """
    Guarda el PDF extraído en la estructura de carpetas organizada.
    
    Args:
        pdf_data: Datos binarios del PDF
        codigo_b2b: Código del pedido B2B
        fecha_correo: Fecha del correo
    
    Returns:
        Ruta del archivo guardado o None si hay error
    """
    try:
        # Crear estructura de carpetas por año/mes
        año = fecha_correo.strftime('%Y')
        mes = fecha_correo.strftime('%m')
        
        # Ruta base para archivos extraídos
        base_path = '/home/cecheverria/work/projects/RepuestoCenter/backend/archivos_extraidos/gmail_pdfs'
        carpeta_pdf = os.path.join(base_path, año, mes)
        
        # Crear carpeta si no existe
        os.makedirs(carpeta_pdf, exist_ok=True)
        
        # Nombre del archivo: B2B00006752_2025-10-06_04-17.pdf
        timestamp = fecha_correo.strftime('%Y-%m-%d_%H-%M')
        nombre_archivo = f"{codigo_b2b}_{timestamp}.pdf"
        ruta_completa = os.path.join(carpeta_pdf, nombre_archivo)
        
        # Guardar PDF
        with open(ruta_completa, 'wb') as f:
            f.write(pdf_data)
        
        print(f"DEBUG: PDF guardado en {ruta_completa}")
        return ruta_completa
        
    except Exception as e:
        print(f"ERROR guardando PDF para {codigo_b2b}: {e}")
        return None


def extraer_info_cliente(texto_plano: str) -> Dict[str, str]:
    """Extrae la información del cliente, dirección, etc."""
    info = {
        'rut': extraer_campo(texto_plano, r"RUT:\s*(\S+)"),
        'razon_social': extraer_campo(texto_plano, r"Razón Social:\s*(.+?)\n"),
        'direccion': extraer_campo(texto_plano, r"Dirección:\s*(.+?)\n"),
        'comuna': extraer_campo(texto_plano, r"Comuna:\s*(.+?)\n"),
        'tipo_despacho': extraer_campo(texto_plano, r"Tipo Despacho:\s*(.+?)\n"),
        'transporte': extraer_campo(texto_plano, r"Transporte:\s*(.+?)\n")
    }
    return info


def extraer_info_cliente_de_pdf(pdf_bytes: bytes) -> Dict[str, str]:
    """Extrae la información del cliente del PDF."""
    info = {
        'rut': '',
        'razon_social': '',
        'direccion': '',
        'comuna': '',
        'tipo_despacho': '',
        'transporte': ''
    }
    
    try:
        pdf_stream = io.BytesIO(pdf_bytes)
        with pdfplumber.open(pdf_stream) as pdf:
            if len(pdf.pages) > 0:
                # Extraer texto de la primera página
                texto = pdf.pages[0].extract_text()
                
                if texto:
                    # Extraer información usando regex
                    info['razon_social'] = extraer_campo(texto, r"Cliente\s*:\s*(.+?)(?:\n|F\s+Emisión)", '')
                    info['rut'] = extraer_campo(texto, r"Rut\s*:\s*(\S+)", '')
                    info['direccion'] = extraer_campo(texto, r"Dirección\s*:\s*(.+?)(?:\n|Contacto)", '')
                    info['comuna'] = extraer_campo(texto, r"Comuna\s*:\s*(.+?)(?:\n|Teléfono)", '')
                    info['tipo_despacho'] = extraer_campo(texto, r"Tipo Despacho\s*:\s*(.+?)(?:\n|Vendedor)", '')
                    info['transporte'] = extraer_campo(texto, r"Transporte\s*:\s*(.+?)(?:\n|Tipo\s+Pago)", '')
                    
                    print(f"DEBUG PDF: Cliente extraído del PDF - RUT={info['rut']}, Razón={info['razon_social'][:30] if info['razon_social'] else 'N/A'}")
    
    except Exception as e:
        print(f"ERROR PDF: No se pudo extraer info del cliente: {e}")
    
    return info


def extraer_productos_de_pdf(pdf_bytes: bytes) -> List[Dict]:
    """Extrae los productos del PDF adjunto al correo."""
    productos = []
    
    try:
        # Abrir el PDF desde bytes
        pdf_stream = io.BytesIO(pdf_bytes)
        
        with pdfplumber.open(pdf_stream) as pdf:
            print(f"DEBUG PDF: Número de páginas: {len(pdf.pages)}")
            
            for page_num, page in enumerate(pdf.pages):
                print(f"DEBUG PDF: Procesando página {page_num + 1}")
                
                # Extraer tablas de la página
                tables = page.extract_tables()
                
                if not tables:
                    print(f"DEBUG PDF: No se encontraron tablas en página {page_num + 1}")
                    continue
                
                print(f"DEBUG PDF: Se encontraron {len(tables)} tabla(s) en página {page_num + 1}")
                
                for table_idx, table in enumerate(tables):
                    if not table or len(table) < 2:  # Necesita al menos header + 1 fila
                        continue
                    
                    print(f"DEBUG PDF: Tabla {table_idx}: {len(table)} filas, {len(table[0]) if table else 0} columnas")
                    
                    # Buscar la fila de encabezado que contiene productos
                    header_row_idx = None
                    for idx, row in enumerate(table[:5]):  # Buscar en las primeras 5 filas
                        row_text = ' '.join([str(cell).lower() if cell else '' for cell in row])
                        if 'producto' in row_text or 'sku' in row_text or 'código' in row_text:
                            header_row_idx = idx
                            print(f"DEBUG PDF: Encabezado encontrado en fila {idx}: {row}")
                            break
                    
                    if header_row_idx is None:
                        print(f"DEBUG PDF: No se encontró encabezado de productos en tabla {table_idx}")
                        continue
                    
                    # Determinar índices de columnas
                    header = table[header_row_idx]
                    col_sku = None
                    col_nombre = None
                    col_cantidad = None
                    col_precio = None
                    
                    for col_idx, cell in enumerate(header):
                        cell_lower = str(cell).lower() if cell else ''
                        if 'sku' in cell_lower or 'código' in cell_lower:
                            col_sku = col_idx
                        elif 'producto' in cell_lower or 'descripción' in cell_lower or 'nombre' in cell_lower:
                            col_nombre = col_idx
                        elif 'cantidad' in cell_lower or 'cant.' in cell_lower or 'qty' in cell_lower:
                            col_cantidad = col_idx
                        elif 'precio' in cell_lower or 'valor' in cell_lower or 'unit' in cell_lower:
                            col_precio = col_idx
                    
                    print(f"DEBUG PDF: Columnas detectadas - SKU:{col_sku}, Nombre:{col_nombre}, Cant:{col_cantidad}, Precio:{col_precio}")
                    
                    # Procesar filas de datos
                    for row in table[header_row_idx + 1:]:
                        if not row or len(row) < max(filter(None, [col_sku, col_nombre, col_cantidad, col_precio]) or [0]) + 1:
                            continue
                        
                        try:
                            sku = str(row[col_sku]).strip() if col_sku is not None and row[col_sku] else ''
                            nombre = str(row[col_nombre]).strip() if col_nombre is not None and row[col_nombre] else ''
                            cantidad_str = str(row[col_cantidad]).strip() if col_cantidad is not None and row[col_cantidad] else '0'
                            precio_str = str(row[col_precio]).strip() if col_precio is not None and row[col_precio] else '0'
                            
                            # Limpiar y convertir cantidad
                            cantidad = int(float(cantidad_str.replace(',', '').replace('.', '')))
                            
                            # Limpiar y convertir precio
                            precio = float(precio_str.replace('$', '').replace('.', '').replace(',', '.').strip())
                            
                            if sku and cantidad > 0:
                                producto = {
                                    'sku': sku,
                                    'nombre_producto': nombre,
                                    'cantidad': cantidad,
                                    'valor_unitario': precio
                                }
                                productos.append(producto)
                                print(f"DEBUG PDF: Producto extraído: {sku} - {nombre} - Cant:{cantidad} - Precio:{precio}")
                        
                        except (ValueError, IndexError) as e:
                            print(f"DEBUG PDF: Error procesando fila: {e}")
                            continue
    
    except Exception as e:
        print(f"ERROR PDF: No se pudo procesar el PDF: {e}")
        import traceback
        traceback.print_exc()
    
    return productos


def extraer_tabla_productos(soup) -> List[Dict]:
    """Extrae los productos de la tabla HTML del correo (deprecated - ahora se usa PDF)."""
    productos = []
    tabla = soup.find('table', id='tabla-productos')
    if not tabla:
        print(f"DEBUG: No se encontró tabla con id='tabla-productos' en HTML")
        return productos
        
    tbody = tabla.find('tbody')
    if not tbody:
        print(f"DEBUG: Tabla encontrada pero sin tbody")
        return productos
        
    for fila in tbody.find_all('tr'):
        celdas = fila.find_all('td')
        if len(celdas) >= 5:
            try:
                producto = {
                    'sku': celdas[0].text.strip(),
                    'nombre_producto': celdas[1].text.strip(),
                    'cantidad': int(celdas[3].text.strip()),
                    'valor_unitario': float(celdas[4].text.replace('$', '').replace('.', '').replace(',', '.').strip()),
                }
                productos.append(producto)
            except (ValueError, IndexError) as e:
                print(f"Error procesando fila de producto: {e}")
                continue
    return productos


# --- LÓGICA DE INTEGRACIÓN ---

def pedido_ya_existe(codigo_b2b: str, db: Session) -> bool:
    """Verifica si un pedido ya está registrado en el sistema."""
    from app.models.negocio.pedidos import Pedido
    pedido = db.query(Pedido).filter(Pedido.codigo_pedido_origen == codigo_b2b).first()
    return pedido is not None


def obtener_informacion_pedido_existente(codigo_b2b: str, db: Session) -> Optional[Dict]:
    """Obtiene información del pedido existente para comparar con el nuevo."""
    from app.models.negocio.pedidos import Pedido
    pedido = db.query(Pedido).filter(Pedido.codigo_pedido_origen == codigo_b2b).first()
    if not pedido:
        return None
    
    return {
        'id_pedido': pedido.id_pedido,
        'codigo_pedido_origen': pedido.codigo_pedido_origen,
        'numero_pedido_sap': pedido.numero_pedido_sap,
        'id_cliente': pedido.id_cliente,
        'monto_total': float(pedido.monto_total) if pedido.monto_total else 0,
        'fecha_creacion': pedido.fecha_creacion.isoformat() if pedido.fecha_creacion else None
    }


def generar_codigo_b2b_alternativo(codigo_b2b_original: str, db: Session) -> str:
    """Genera un código B2B alternativo agregando (*) al final si ya existe."""
    codigo_alternativo = f"{codigo_b2b_original}*"
    
    # Verificar si el código con (*) también existe
    contador = 1
    while pedido_ya_existe(codigo_alternativo, db):
        codigo_alternativo = f"{codigo_b2b_original}*{contador}"
        contador += 1
        # Protección contra bucle infinito
        if contador > 99:
            break
    
    return codigo_alternativo


def son_pedidos_diferentes(pedido_existente: Dict, nuevo_pedido: Dict) -> bool:
    """Compara dos pedidos para determinar si son realmente diferentes."""
    # Comparar número SAP
    sap_existente = pedido_existente.get('numero_pedido_sap')
    sap_nuevo = nuevo_pedido.get('numero_pedido_sap')
    
    if sap_existente and sap_nuevo and sap_existente != sap_nuevo:
        return True
    
    # Comparar cliente
    if pedido_existente.get('id_cliente') != nuevo_pedido.get('id_cliente'):
        return True
    
    # Comparar monto total (con tolerancia de 0.01)
    monto_existente = pedido_existente.get('monto_total', 0)
    monto_nuevo = nuevo_pedido.get('monto_total', 0)
    if abs(monto_existente - monto_nuevo) > 0.01:
        return True
    
    return False


def obtener_o_crear_cliente(info_cliente: Dict, db: Session) -> Optional[int]:
    """Verifica si el cliente existe por RUT, si no, retorna None (se debe crear manualmente)."""
    from app.models.entidades.maestro_clientes import MaestroClientes
    
    # Buscar cliente por RUT
    rut = info_cliente.get('rut', '').strip()
    if not rut or rut == 'No encontrado':
        return None
        
    cliente = db.query(MaestroClientes).filter(MaestroClientes.rut_cliente == rut).first()
    if cliente:
        return cliente.id_cliente
    
    # Si no existe, retornamos None - los clientes deben crearse manualmente en el sistema
    return None


def obtener_producto_por_sku(sku: str, db: Session) -> Optional[int]:
    """Obtiene el ID del producto por SKU (case insensitive)."""
    from app.models.productos.maestro_productos import MaestroProductos
    
    # Buscar con case insensitive para evitar problemas de mayúsculas/minúsculas
    producto = db.query(MaestroProductos).filter(
        (MaestroProductos.sku == sku) | 
        (MaestroProductos.sku == sku.upper()) |
        (MaestroProductos.sku == sku.lower())
    ).first()
    
    if producto:
        return producto.id_producto
    return None


def registrar_pedido_en_sistema(
    datos_pedido: Dict, 
    productos: List[Dict], 
    db: Session
) -> Tuple[bool, str, Optional[int]]:
    """
    Registra el pedido y su detalle en la base de datos.
    Retorna: (exito, mensaje, id_pedido)
    """
    from app.models.negocio.pedidos import Pedido, PedidoDetalle
    from datetime import datetime as dt
    
    try:
        # Verificar si ya existe
        if pedido_ya_existe(datos_pedido['codigo_b2b'], db):
            return False, f"El pedido {datos_pedido['codigo_b2b']} ya existe", None
        
        # Obtener o verificar cliente
        id_cliente = obtener_o_crear_cliente(datos_pedido['info_cliente'], db)
        if not id_cliente:
            return False, f"Cliente con RUT {datos_pedido['info_cliente'].get('rut')} no encontrado en el sistema", None
        
        # Obtener el vendedor del cliente para heredarlo al pedido
        from app.models.entidades import MaestroClientes
        cliente = db.query(MaestroClientes).filter_by(id_cliente=id_cliente).first()
        id_vendedor_cliente = cliente.id_vendedor if cliente else None
        
        # Obtener estados iniciales
        from app.models.negocio.pedidos import EstadoPedido, EstadoAprobacionCredito
        estado_nuevo = db.query(EstadoPedido).filter(EstadoPedido.codigo_estado == 'NUEVO').first()
        estado_credito_pendiente = db.query(EstadoAprobacionCredito).filter(EstadoAprobacionCredito.codigo_estado == 'PENDIENTE').first()
        
        if not estado_nuevo or not estado_credito_pendiente:
            return False, "No se encontraron los estados iniciales necesarios en el sistema", None
        
        # Obtener canal B2B (asumir que existe un canal con código "B2B")
        from app.models.negocio.canales import CanalVenta
        canal_b2b = CanalVenta.get_by_codigo('B2B')
        if not canal_b2b:
            return False, "No se encontró el canal de venta B2B en el sistema", None
        
        # Crear el pedido
        nuevo_pedido = Pedido(
            codigo_pedido_origen=datos_pedido['codigo_b2b'],
            id_cliente=id_cliente,
            id_canal_venta=canal_b2b.id_canal,
            id_vendedor=id_vendedor_cliente,  # Heredar vendedor del cliente
            id_estado_general=estado_nuevo.id_estado,
            id_estado_credito=estado_credito_pendiente.id_estado,
            monto_neto=0,  # Se calculará después
            monto_impuestos=0,
            monto_total=0
        )
        nuevo_pedido.fecha_creacion = dt.now()
        
        db.add(nuevo_pedido)
        db.flush()  # Para obtener el id_pedido
        
        # Crear historial inicial de estado
        from app.models.negocio.pedidos import HistorialEstadoPedido
        historial = HistorialEstadoPedido(
            id_pedido=nuevo_pedido.id_pedido,
            fecha_evento=dt.now(),
            estado_nuevo=estado_credito_pendiente.nombre_estado,
            tipo_estado="CREDITO",
            id_usuario_responsable=1,  # Usuario sistema
            observaciones="Pedido importado desde Gmail B2B, pendiente de aprobación de crédito."
        )
        db.add(historial)
        
        # Crear los detalles del pedido
        productos_no_encontrados = []
        for prod in productos:
            id_producto = obtener_producto_por_sku(prod['sku'], db)
            if not id_producto:
                productos_no_encontrados.append(prod['sku'])
                continue
            
            detalle = PedidoDetalle(
                id_pedido=nuevo_pedido.id_pedido,
                id_producto=id_producto,
                cantidad=prod['cantidad'],
                precio_unitario=prod.get('valor_unitario', 0),
                subtotal=prod['cantidad'] * prod.get('valor_unitario', 0)
            )
            db.add(detalle)
        
        # Calcular montos totales
        total_neto = sum(prod['cantidad'] * prod.get('valor_unitario', 0) for prod in productos if obtener_producto_por_sku(prod['sku'], db))
        total_iva = total_neto * 0.19  # 19% IVA
        total_final = total_neto + total_iva
        
        nuevo_pedido.monto_neto = total_neto
        nuevo_pedido.monto_impuestos = total_iva
        nuevo_pedido.monto_total = total_final
        
        db.commit()
        
        mensaje = f"Pedido {datos_pedido['codigo_b2b']} registrado exitosamente"
        if productos_no_encontrados:
            mensaje += f". Productos no encontrados (no agregados): {', '.join(productos_no_encontrados)}"
        
        return True, mensaje, nuevo_pedido.id_pedido
        
    except Exception as e:
        db.rollback()
        return False, f"Error al registrar pedido: {str(e)}", None


def extraer_pedidos_preview(
    fecha_desde: Optional[str] = None, 
    fecha_hasta: Optional[str] = None,
    remitente: str = "ventas@solomon-ti.com",
    asunto: str = '("Venta B2B Creada" OR "Venta B2B Pendiente Aprobación")',
    db: Optional[Session] = None
) -> Dict:
    """
    Extrae información de pedidos B2B desde Gmail sin crear nada en la base de datos.
    Valida y retorna la información detallada para revisión del usuario.
    """
    resultado = {
        'exito': True,
        'mensaje': '',
        'pedidos': [],
        'errores': []
    }
    
    try:
        service = autenticar_gmail()
        
        # Construir query de búsqueda
        query_parts = [
            f'from:"{remitente}"',
            f'subject:{asunto}'
        ]
        
        if not fecha_desde:
            after_date = (datetime.now() - timedelta(days=1))
            query_parts.append(f"after:{after_date.strftime('%Y/%m/%d')}")
        else:
            after_date = datetime.strptime(fecha_desde, '%Y-%m-%d')
            query_parts.append(f"after:{after_date.strftime('%Y/%m/%d')}")

        if fecha_hasta:
            before_date = datetime.strptime(fecha_hasta, '%Y-%m-%d') + timedelta(days=1)
            query_parts.append(f"before:{before_date.strftime('%Y/%m/%d')}")

        query = " ".join(query_parts)
        print(f"DEBUG: Ejecutando consulta en Gmail: '{query}'")
        
        # Buscar correos
        response = service.users().messages().list(userId='me', q=query).execute()
        messages = response.get('messages', [])
        
        if not messages:
            resultado['mensaje'] = f"No se encontraron correos para la consulta: '{query}'"
            return resultado
            
        total_mensajes = len(messages)
        print(f"INFO: Se encontraron {total_mensajes} correos para procesar.")

        for i, msg in enumerate(messages):
            codigo_b2b_actual = 'desconocido'
            try:
                print(f"Procesando correo {i+1}/{total_mensajes}...")
                msg_data = service.users().messages().get(userId='me', id=msg['id'], format='full').execute()
                payload = msg_data['payload']
                headers = payload['headers']
                
                # Extraer información del correo
                subject = next((h['value'] for h in headers if h['name'] == 'Subject'), '')
                date_header = next((h['value'] for h in headers if h['name'] == 'Date'), '')
                
                # Parsear fecha del correo
                from email.utils import parsedate_to_datetime
                fecha_correo = parsedate_to_datetime(date_header) if date_header else datetime.now()
                
                # Detectar si está aprobado o pendiente
                esta_aprobado = 'Creada' in subject or 'creada' in subject
                esta_pendiente = 'Pendiente' in subject or 'pendiente' in subject
                
                codigo_b2b_actual = extraer_campo(subject, r'Nº ([A-Z0-9]+)', 'No encontrado')
                
                print(f"DEBUG: Pedido {codigo_b2b_actual} - Aprobado: {esta_aprobado}, Pendiente: {esta_pendiente}, Fecha: {fecha_correo}")
                
                if codigo_b2b_actual == 'No encontrado' or not codigo_b2b_actual:
                    error_msg = 'No se pudo extraer el código B2B del asunto'
                    resultado['errores'].append({'mensaje': error_msg, 'asunto': subject})
                    print(f"ERROR: {error_msg} - Asunto: '{subject}'")
                    continue
                
                # Decodificar cuerpo del correo - Buscar HTML en estructura anidada
                html_content = None
                
                # Función recursiva para buscar HTML
                def buscar_html_recursivo(parts):
                    for p in parts:
                        mime = p.get('mimeType', '')
                        body = p.get('body', {})
                        
                        # Si es HTML y tiene datos
                        if mime == 'text/html' and 'data' in body:
                            return p
                        
                        # Si tiene sub-partes, buscar recursivamente
                        if 'parts' in p:
                            result = buscar_html_recursivo(p['parts'])
                            if result:
                                return result
                    return None
                
                html_part = None
                if 'parts' in payload:
                    print(f"DEBUG [{codigo_b2b_actual}]: Payload tiene {len(payload['parts'])} parte(s)")
                    for idx, p in enumerate(payload['parts']):
                        mime = p.get('mimeType', '')
                        has_data = 'data' in p.get('body', {})
                        has_parts = 'parts' in p
                        print(f"DEBUG [{codigo_b2b_actual}]: Parte {idx}: mime={mime}, data={has_data}, subparts={has_parts}")
                    
                    html_part = buscar_html_recursivo(payload['parts'])
                elif 'body' in payload and 'data' in payload['body']:
                    # HTML directo sin partes
                    html_part = payload
                    print(f"DEBUG [{codigo_b2b_actual}]: HTML directo en body (sin parts)")
                
                if not html_part or 'data' not in html_part.get('body', {}):
                    error_msg = 'No se encontró contenido HTML en el correo'
                    resultado['errores'].append({'codigo_b2b': codigo_b2b_actual, 'mensaje': error_msg})
                    print(f"ERROR: {error_msg} (Pedido: {codigo_b2b_actual})")
                    continue
                
                data = base64.urlsafe_b64decode(html_part['body']['data']).decode('utf-8')
                soup = BeautifulSoup(data, 'html.parser')
                texto_plano_correo = soup.get_text()
                
                # Guardar HTML de ejemplo (solo primer correo)
                if i == 0:
                    try:
                        with open('/tmp/correo_ejemplo.html', 'w', encoding='utf-8') as f:
                            f.write(data)
                        print(f"DEBUG: HTML guardado en /tmp/correo_ejemplo.html para inspección")
                    except Exception as e:
                        print(f"DEBUG: No se pudo guardar HTML: {e}")
                
                # Buscar PDF adjunto con los productos
                pdf_part = None
                if 'parts' in payload:
                    for p in payload['parts']:
                        mime = p.get('mimeType', '')
                        filename = p.get('filename', '')
                        
                        # Buscar adjuntos PDF
                        if ('application/pdf' in mime or 'application/octet-stream' in mime) and 'data' not in p.get('body', {}):
                            # Si tiene attachmentId, necesitamos descargarlo
                            attachment_id = p.get('body', {}).get('attachmentId')
                            if attachment_id:
                                print(f"DEBUG [{codigo_b2b_actual}]: Descargando adjunto PDF - {filename}")
                                try:
                                    attachment = service.users().messages().attachments().get(
                                        userId='me',
                                        messageId=msg['id'],
                                        id=attachment_id
                                    ).execute()
                                    
                                    pdf_data = base64.urlsafe_b64decode(attachment['data'])
                                    pdf_part = pdf_data
                                    print(f"DEBUG [{codigo_b2b_actual}]: PDF descargado - {len(pdf_data)} bytes")
                                    
                                    # Guardar PDF de ejemplo (solo primer correo)
                                    if i == 0:
                                        try:
                                            with open('/tmp/pedido_ejemplo.pdf', 'wb') as f:
                                                f.write(pdf_data)
                                            print(f"DEBUG: PDF guardado en /tmp/pedido_ejemplo.pdf para inspección")
                                        except Exception as e:
                                            print(f"DEBUG: No se pudo guardar PDF: {e}")
                                    
                                    break
                                except Exception as e:
                                    print(f"ERROR [{codigo_b2b_actual}]: No se pudo descargar adjunto: {e}")
                
                # Extraer información del cliente y productos del PDF si existe
                info_cliente = {}
                productos_extraidos = []
                numero_sap = ''
                ruta_pdf = None
                
                if pdf_part:
                    # Guardar PDF extraído para descarga posterior
                    ruta_pdf = guardar_pdf_extraido(pdf_part, codigo_b2b_actual, fecha_correo)
                    
                    # Extraer del PDF (fuente principal para cliente y productos)
                    info_cliente = extraer_info_cliente_de_pdf(pdf_part)
                    productos_extraidos = extraer_productos_de_pdf(pdf_part)
                    
                    # El número SAP NUNCA está en el PDF, siempre está en el cuerpo del correo
                    # Extraer número SAP del cuerpo del correo
                    numero_sap = extraer_campo(texto_plano_correo, r"Número\s+Interno\s*:\s*(\d+)", '')
                else:
                    # Fallback: intentar extraer del HTML (para correos antiguos)
                    print(f"DEBUG [{codigo_b2b_actual}]: No se encontró PDF, intentando extraer del HTML")
                    info_cliente = extraer_info_cliente(texto_plano_correo)
                    productos_extraidos = extraer_tabla_productos(soup)
                    # Solo extraer "Número Interno" del cuerpo del correo (nunca del PDF)
                    numero_sap = extraer_campo(texto_plano_correo, r"Número\s+Interno\s*:\s*(\d+)", '')
                
                # Validar número SAP (aplicar tanto si hay PDF como si no)
                if numero_sap:
                    # Validar que no sea un código B2B (debe ser solo números)
                    if numero_sap.startswith('B2B') or not numero_sap.isdigit():
                        print(f"WARNING [{codigo_b2b_actual}]: Número SAP inválido (parece ser código B2B): {numero_sap}")
                        numero_sap = ''  # No guardar códigos B2B como número SAP
                    else:
                        print(f"DEBUG [{codigo_b2b_actual}]: Pedido confirmado - Número Interno SAP: {numero_sap}")
                
                print(f"DEBUG [{codigo_b2b_actual}]: Cliente - RUT={info_cliente.get('rut', 'N/A')}, Razón={info_cliente.get('razon_social', 'N/A')[:30] if info_cliente.get('razon_social') else 'N/A'}")
                print(f"DEBUG [{codigo_b2b_actual}]: {len(productos_extraidos)} producto(s) extraídos")
                if len(productos_extraidos) > 0:
                    print(f"DEBUG [{codigo_b2b_actual}]: Primer producto: SKU={productos_extraidos[0].get('sku')} - {productos_extraidos[0].get('nombre_producto', '')[:30]}")
                
                # Validaciones
                advertencias = []
                estado_validacion = 'valido'  # 'valido', 'advertencia', 'error'
                
                # Verificar si el pedido ya existe y analizar si es diferente
                pedido_existe = False
                pedido_duplicado_diferente = False
                codigo_b2b_alternativo = codigo_b2b_actual
                
                if db and pedido_ya_existe(codigo_b2b_actual, db):
                    # Obtener información del pedido existente
                    pedido_existente_info = obtener_informacion_pedido_existente(codigo_b2b_actual, db)
                    
                    if pedido_existente_info:
                        # Crear información del nuevo pedido para comparar
                        nuevo_pedido_info = {
                            'numero_pedido_sap': numero_sap,
                            'id_cliente': None,  # Se determinará después
                            'monto_total': sum(prod.get('cantidad', 0) * prod.get('valor_unitario', 0) for prod in productos_extraidos)
                        }
                        
                        # Verificar si son pedidos diferentes
                        if son_pedidos_diferentes(pedido_existente_info, nuevo_pedido_info):
                            pedido_duplicado_diferente = True
                            codigo_b2b_alternativo = generar_codigo_b2b_alternativo(codigo_b2b_actual, db)
                            advertencias.append(f'Pedido duplicado detectado. Se creará con código alternativo: {codigo_b2b_alternativo}')
                            estado_validacion = 'advertencia'
                        else:
                            pedido_existe = True
                            advertencias.append('El pedido ya existe en el sistema (idéntico)')
                            estado_validacion = 'cargado'
                    else:
                        pedido_existe = True
                        advertencias.append('El pedido ya existe en el sistema')
                        estado_validacion = 'cargado'
                
                # Verificar si el cliente existe
                cliente_existe = False
                id_cliente = None
                if db:
                    id_cliente = obtener_o_crear_cliente(info_cliente, db)
                    cliente_existe = id_cliente is not None
                    if not cliente_existe:
                        advertencias.append(f"Cliente con RUT {info_cliente.get('rut', 'N/A')} no encontrado en el sistema")
                        if estado_validacion == 'valido':
                            estado_validacion = 'advertencia'
                
                # Verificar productos
                productos_validados = []
                productos_no_encontrados = []
                for prod in productos_extraidos:
                    prod_validado = {
                        'sku': prod['sku'],
                        'nombre_producto': prod['nombre_producto'],
                        'cantidad': prod['cantidad'],
                        'valor_unitario': prod['valor_unitario'],
                        'existe': False,
                        'id_producto': None
                    }
                    
                    if db:
                        id_producto = obtener_producto_por_sku(prod['sku'], db)
                        if id_producto:
                            prod_validado['existe'] = True
                            prod_validado['id_producto'] = id_producto
                        else:
                            productos_no_encontrados.append(prod['sku'])
                    
                    productos_validados.append(prod_validado)
                
                if productos_no_encontrados:
                    advertencias.append(f"Productos no encontrados: {', '.join(productos_no_encontrados[:5])}{'...' if len(productos_no_encontrados) > 5 else ''}")
                    if estado_validacion == 'valido':
                        estado_validacion = 'advertencia'
                
                if not productos_extraidos:
                    advertencias.append('No se encontraron productos en la tabla del correo')
                    estado_validacion = 'error'
                
                # Agregar pedido al resultado
                pedido_info = {
                    'codigo_b2b': codigo_b2b_actual,
                    'codigo_b2b_alternativo': codigo_b2b_alternativo,
                    'es_duplicado_diferente': pedido_duplicado_diferente,
                    'fecha_pedido': fecha_correo.isoformat(),  # Usar fecha del correo
                    'aprobacion_automatica': esta_aprobado,  # Si está confirmado
                    'numero_pedido_sap': numero_sap if esta_aprobado else None,  # Solo si está aprobado
                    'ruta_pdf': ruta_pdf if pdf_part else None,  # Ruta del PDF guardado
                    'info_cliente': info_cliente,
                    'cliente_existe': cliente_existe,
                    'id_cliente': id_cliente,
                    'productos': productos_validados,
                    'advertencias': advertencias,
                    'estado_validacion': estado_validacion,
                    'seleccionado': estado_validacion not in ['error', 'cargado']  # Auto-deseleccionar si hay errores o ya está cargado
                }
                
                resultado['pedidos'].append(pedido_info)
                
            except Exception as e:
                error_msg = f'Error inesperado procesando correo: {str(e)}'
                resultado['errores'].append({'codigo_b2b': codigo_b2b_actual, 'mensaje': error_msg})
                print(f"ERROR GRAVE: {error_msg} (Pedido: {codigo_b2b_actual})")
                continue
        
        msg_exitosos = f"Se extrajeron {len(resultado['pedidos'])} pedidos."
        msg_errores = f"Se encontraron {len(resultado['errores'])} errores."
        resultado['mensaje'] = f"{msg_exitosos} {msg_errores}"
    
    except HttpError as error:
        resultado['exito'] = False
        resultado['mensaje'] = f'Error de Gmail API: {str(error)}'
    except FileNotFoundError as error:
        resultado['exito'] = False
        resultado['mensaje'] = str(error)
    except Exception as e:
        resultado['exito'] = False
        resultado['mensaje'] = f'Error inesperado general: {str(e)}'
    
    return resultado


def procesar_pedidos_seleccionados(
    pedidos_data: List[Dict],
    db: Session,
    crear_clientes: bool = True,
    crear_productos: bool = True
) -> Dict:
    """
    Procesa una lista de pedidos seleccionados por el usuario.
    Puede crear clientes y productos nuevos si se especifica.
    
    pedidos_data: Lista de pedidos con la estructura:
        {
            'codigo_b2b': str,
            'info_cliente': dict,
            'productos': list,
            'id_cliente': int | None (si existe),
            ...
        }
    """
    from app.models.negocio.pedidos import Pedido, PedidoDetalle
    from app.models.entidades.maestro_clientes import MaestroClientes
    from app.models.productos.maestro_productos import MaestroProductos
    from datetime import datetime as dt
    
    resultado = {
        'exito': True,
        'mensaje': '',
        'pedidos_creados': [],
        'clientes_creados': [],
        'productos_creados': [],
        'errores': []
    }
    
    try:
        for pedido_info in pedidos_data:
            codigo_b2b = pedido_info.get('codigo_b2b', 'desconocido')
            
            try:
                # 1. Verificar/Crear Cliente
                id_cliente = pedido_info.get('id_cliente')
                
                if not id_cliente:
                    info_cliente = pedido_info.get('info_cliente', {})
                    rut = info_cliente.get('rut', '').strip()
                    
                    # Primero buscar si existe en la BD (por si el preview estaba desactualizado)
                    if rut:
                        cliente_existente = db.query(MaestroClientes).filter(
                            MaestroClientes.rut_cliente == rut
                        ).first()
                        
                        if cliente_existente:
                            id_cliente = cliente_existente.id_cliente
                            print(f"DEBUG: Cliente RUT {rut} ya existe con ID {id_cliente}")
                    
                    # Si no existe y crear_clientes está activo, crear uno nuevo
                    if not id_cliente and crear_clientes:
                        try:
                            # Generar código de cliente basado en RUT (formato C + RUT sin guión)
                            codigo_cliente = f"C{rut.replace('-', '')}" if rut else f"CB2B{codigo_b2b}"
                            
                            nuevo_cliente = MaestroClientes(
                                rut_cliente=rut,
                                codigo_cliente=codigo_cliente,
                                nombre_cliente=info_cliente.get('razon_social', 'Cliente B2B').strip(),
                                id_tipo_cliente=-1,
                                id_segmento_cliente=-1,
                                id_tipo_negocio=-1,
                                id_lista_precios=-1,
                                id_condicion_pago=-1,
                                id_usuario_creacion=1,
                                activo=True
                            )
                            db.add(nuevo_cliente)
                            db.flush()
                            id_cliente = nuevo_cliente.id_cliente
                            resultado['clientes_creados'].append({
                                'rut': nuevo_cliente.rut_cliente,
                                'nombre': nuevo_cliente.nombre_cliente,
                                'id_cliente': id_cliente
                            })
                            print(f"DEBUG: Cliente RUT {rut} creado con ID {id_cliente}")
                        except Exception as e:
                            import traceback
                            # Verificar si el error es por duplicado
                            if 'duplicate key' in str(e).lower() or 'unique constraint' in str(e).lower():
                                # Otro proceso lo creó mientras tanto, buscar nuevamente
                                db.rollback()
                                db.expire_all()  # Limpiar caché de la sesión
                                
                                # Esperar un poco y buscar nuevamente (race condition)
                                import time
                                time.sleep(0.1)
                                
                                if rut:
                                    # Buscar nuevamente con sesión limpia
                                    cliente_existente = db.query(MaestroClientes).filter(
                                        MaestroClientes.rut_cliente == rut
                                    ).first()
                                    if cliente_existente:
                                        id_cliente = cliente_existente.id_cliente
                                        print(f"DEBUG: Cliente RUT {rut} ya existe (encontrado después de rollback), usando ID {id_cliente}")
                                    else:
                                        resultado['errores'].append({
                                            'codigo_b2b': codigo_b2b,
                                            'tipo': 'cliente',
                                            'mensaje': f'Cliente duplicado pero no encontrado en BD. Posible inconsistencia.',
                                            'detalle': f'RUT: {rut}\nError original: {str(e)}'
                                        })
                                        print(f"ADVERTENCIA: Cliente RUT {rut} duplicado pero no encontrado después de rollback")
                                        continue
                            else:
                                resultado['errores'].append({
                                    'codigo_b2b': codigo_b2b,
                                    'tipo': 'cliente',
                                    'mensaje': f'Error al crear cliente: {str(e)}',
                                    'detalle': traceback.format_exc()
                                })
                                print(f"ERROR creando cliente para {codigo_b2b}: {e}")
                                traceback.print_exc()
                                db.rollback()
                                continue
                
                if not id_cliente:
                    resultado['errores'].append({
                        'codigo_b2b': codigo_b2b,
                        'tipo': 'cliente',
                        'mensaje': 'No se pudo obtener o crear el cliente'
                    })
                    continue
                
                # Obtener el vendedor del cliente para heredarlo al pedido
                from app.models.entidades import MaestroClientes
                cliente = db.query(MaestroClientes).filter_by(id_cliente=id_cliente).first()
                id_vendedor_cliente = cliente.id_vendedor if cliente else None
                
                # 2. Determinar el código B2B a usar (original o alternativo)
                codigo_b2b_final = codigo_b2b
                
                # Si es un duplicado diferente, usar el código alternativo
                if pedido_info.get('es_duplicado_diferente', False):
                    codigo_b2b_final = pedido_info.get('codigo_b2b_alternativo', codigo_b2b)
                    print(f"DEBUG: Usando código alternativo {codigo_b2b_final} para pedido duplicado {codigo_b2b}")
                else:
                    # Verificar si el pedido ya existe (para casos normales)
                    if pedido_ya_existe(codigo_b2b, db):
                        resultado['errores'].append({
                            'codigo_b2b': codigo_b2b,
                            'tipo': 'pedido',
                            'mensaje': 'El pedido ya existe en el sistema'
                        })
                        continue
                
                # 3. Obtener estados y canal necesarios
                from app.models.negocio.pedidos import EstadoPedido, EstadoAprobacionCredito
                from app.models.negocio.canales import CanalVenta
                
                aprobacion_automatica = pedido_info.get('aprobacion_automatica', False)
                numero_sap = pedido_info.get('numero_pedido_sap')
                fecha_pedido = pedido_info.get('fecha_pedido', dt.now().isoformat())
                
                # Parsear fecha desde ISO
                from datetime import datetime as dt_module
                fecha_evento = dt_module.fromisoformat(fecha_pedido)
                
                # Determinar estados según aprobación
                if aprobacion_automatica:
                    # Pedido YA aprobado → EN_PROCESO
                    estado_general = db.query(EstadoPedido).filter(EstadoPedido.codigo_estado == 'EN_PROCESO').first()
                    estado_credito = db.query(EstadoAprobacionCredito).filter(EstadoAprobacionCredito.codigo_estado == 'APROBADO').first()
                else:
                    # Pedido pendiente → NUEVO
                    estado_general = db.query(EstadoPedido).filter(EstadoPedido.codigo_estado == 'NUEVO').first()
                    estado_credito = db.query(EstadoAprobacionCredito).filter(EstadoAprobacionCredito.codigo_estado == 'PENDIENTE').first()
                
                # Buscar canal B2B
                canal_b2b = CanalVenta.get_by_codigo('B2B')
                
                if not estado_general or not estado_credito or not canal_b2b:
                    resultado['errores'].append({
                        'codigo_b2b': codigo_b2b,
                        'tipo': 'configuracion',
                        'mensaje': f'No se encontraron los estados necesarios (estado_general={estado_general}, estado_credito={estado_credito}, canal={canal_b2b})'
                    })
                    continue
                
                # 4. Crear el pedido
                try:
                    nuevo_pedido = Pedido(
                        codigo_pedido_origen=codigo_b2b_final,
                        id_cliente=id_cliente,
                        id_canal_venta=canal_b2b.id_canal,
                        id_vendedor=id_vendedor_cliente,  # Heredar vendedor del cliente
                        id_estado_general=estado_general.id_estado,
                        id_estado_credito=estado_credito.id_estado,
                        monto_neto=0,  # Se calculará después
                        monto_impuestos=0,
                        monto_total=0
                    )
                    
                    # Establecer fecha de creación del correo
                    nuevo_pedido.fecha_creacion = fecha_evento
                    
                    # Si tiene número SAP, agregarlo
                    if numero_sap:
                        nuevo_pedido.numero_pedido_sap = numero_sap
                        print(f"DEBUG: Asignado número SAP {numero_sap} al pedido {codigo_b2b}")
                    
                    # Si tiene ruta de PDF, agregarla
                    ruta_pdf = pedido_info.get('ruta_pdf')
                    if ruta_pdf:
                        nuevo_pedido.ruta_pdf = ruta_pdf
                        print(f"DEBUG: Asignada ruta PDF {ruta_pdf} al pedido {codigo_b2b}")
                    
                    db.add(nuevo_pedido)
                    db.flush()
                    
                    # Forzar la fecha exacta (por si el DEFAULT del DB la sobreescribió)
                    db.query(Pedido).filter_by(id_pedido=nuevo_pedido.id_pedido).update({
                        Pedido.fecha_creacion: fecha_evento
                    })
                    
                    # Crear historial inicial de estado CREDITO
                    from app.models.negocio.pedidos import HistorialEstadoPedido
                    if aprobacion_automatica:
                        observacion = "Pedido importado desde Gmail B2B con aprobación automática."
                    else:
                        observacion = "Pedido importado desde Gmail B2B, pendiente de aprobación de crédito."
                    
                    historial_credito = HistorialEstadoPedido(
                        id_pedido=nuevo_pedido.id_pedido,
                        fecha_evento=fecha_evento,
                        estado_nuevo=estado_credito.nombre_estado,
                        tipo_estado="CREDITO",
                        id_usuario_responsable=1,  # Usuario sistema
                        observaciones=observacion
                    )
                    db.add(historial_credito)
                    
                    # Si está aprobado, crear historial de estado GENERAL
                    if aprobacion_automatica:
                        historial_general = HistorialEstadoPedido(
                            id_pedido=nuevo_pedido.id_pedido,
                            fecha_evento=fecha_evento,
                            estado_anterior='NUEVO',
                            estado_nuevo=estado_general.nombre_estado,
                            tipo_estado='GENERAL',
                            id_usuario_responsable=1,
                            observaciones='Inicio de procesamiento por aprobación automática.'
                        )
                        db.add(historial_general)
                except Exception as e:
                    import traceback
                    resultado['errores'].append({
                        'codigo_b2b': codigo_b2b,
                        'tipo': 'pedido',
                        'mensaje': f'Error al crear pedido: {str(e)}',
                        'detalle': traceback.format_exc()
                    })
                    print(f"ERROR creando pedido {codigo_b2b}: {e}")
                    traceback.print_exc()
                    continue
                
                # 5. Procesar productos - Consolidar duplicados primero
                productos_info = pedido_info.get('productos', [])
                productos_consolidados = {}
                
                # Consolidar productos duplicados sumando cantidades (case insensitive)
                for prod_info in productos_info:
                    sku = prod_info.get('sku', '').strip()
                    if not sku:
                        continue
                    
                    # Normalizar SKU para consolidación (usar mayúsculas como clave)
                    sku_key = sku.upper()
                        
                    if sku_key in productos_consolidados:
                        # Sumar cantidades
                        cantidad_actual = productos_consolidados[sku_key].get('cantidad', 0)
                        cantidad_nueva = prod_info.get('cantidad', 0)
                        productos_consolidados[sku_key]['cantidad'] = cantidad_actual + cantidad_nueva
                        print(f"DEBUG: Consolidando SKU {sku} → {sku_key} - Cantidad total: {cantidad_actual + cantidad_nueva}")
                    else:
                        # Crear copia y normalizar SKU
                        prod_copy = prod_info.copy()
                        prod_copy['sku'] = sku  # Mantener SKU original para logs
                        productos_consolidados[sku_key] = prod_copy
                        print(f"DEBUG: SKU {sku} → {sku_key} agregado a consolidación")
                
                productos_agregados = 0
                productos_omitidos = []
                
                for sku_key, prod_info in productos_consolidados.items():
                    sku_original = prod_info.get('sku', sku_key)  # SKU original del PDF
                    id_producto = prod_info.get('id_producto')
                    
                    print(f"DEBUG: Procesando SKU {sku_original} (normalizado: {sku_key})")
                    
                    # Verificar/Crear Producto
                    if not id_producto:
                        # SIEMPRE buscar si existe en la BD (por si el preview estaba desactualizado)
                        # Buscar tanto en mayúsculas como en minúsculas para evitar problemas de case sensitivity
                        producto_existente = db.query(MaestroProductos).filter(
                            (MaestroProductos.sku == sku_key) | 
                            (MaestroProductos.sku == sku_original) |
                            (MaestroProductos.sku == sku_original.upper()) |
                            (MaestroProductos.sku == sku_original.lower())
                        ).first()
                        
                        if producto_existente:
                            # El producto ya existe, usar ese
                            id_producto = producto_existente.id_producto
                            print(f"DEBUG: Producto {sku_original} ya existe con ID {id_producto}")
                        elif crear_productos:
                            # Crear producto nuevo con valores por defecto
                            try:
                                # Normalizar SKU a mayúsculas para consistencia
                                sku_normalizado = sku_key  # Ya está en mayúsculas
                                nuevo_producto = MaestroProductos(
                                    sku=sku_normalizado,
                                    nombre_producto=prod_info.get('nombre_producto', f'Producto {sku_original}'),
                                    id_codigo_referencia=-1,
                                    id_marca=-1,
                                    id_calidad=-1,
                                    id_usuario_creacion=1,
                                    costo_base=0.0,
                                    activo=True
                                )
                                db.add(nuevo_producto)
                                db.flush()
                                id_producto = nuevo_producto.id_producto
                                resultado['productos_creados'].append({
                                    'sku': sku_normalizado,
                                    'nombre': nuevo_producto.nombre_producto,
                                    'id_producto': id_producto
                                })
                                print(f"DEBUG: Producto {sku_original} → {sku_normalizado} creado con ID {id_producto}")
                            except Exception as e:
                                import traceback
                                # Verificar si el error es por duplicado
                                if 'duplicate key' in str(e).lower() or 'unique constraint' in str(e).lower():
                                    # Otro proceso lo creó mientras tanto, buscar nuevamente
                                    db.rollback()
                                    db.expire_all()  # Limpiar caché de la sesión
                                    
                                    # Esperar un poco y buscar nuevamente (race condition)
                                    import time
                                    time.sleep(0.1)
                                    
                                    # Buscar nuevamente con sesión limpia (case insensitive)
                                    producto_existente = db.query(MaestroProductos).filter(
                                        (MaestroProductos.sku == sku_key) | 
                                        (MaestroProductos.sku == sku_original) |
                                        (MaestroProductos.sku == sku_original.upper()) |
                                        (MaestroProductos.sku == sku_original.lower())
                                    ).first()
                                    
                                    if producto_existente:
                                        id_producto = producto_existente.id_producto
                                        print(f"DEBUG: Producto {sku_original} ya existe (encontrado después de rollback), usando ID {id_producto}")
                                    else:
                                        # Realmente no existe, saltar este producto
                                        resultado['errores'].append({
                                            'codigo_b2b': codigo_b2b,
                                            'tipo': 'producto',
                                            'sku': sku_original,
                                            'mensaje': f'Producto duplicado pero no encontrado en BD. Posible inconsistencia.',
                                            'detalle': f'SKU: {sku_original}\nError original: {str(e)}'
                                        })
                                        print(f"ADVERTENCIA: Producto {sku_original} duplicado pero no encontrado después de rollback")
                                        productos_omitidos.append(sku_original)
                                        continue
                                else:
                                    resultado['errores'].append({
                                        'codigo_b2b': codigo_b2b,
                                        'tipo': 'producto',
                                        'sku': sku_original,
                                        'mensaje': f'Error al crear producto: {str(e)}',
                                        'detalle': traceback.format_exc()
                                    })
                                    print(f"ERROR creando producto {sku_original} para {codigo_b2b}: {e}")
                                    traceback.print_exc()
                                    productos_omitidos.append(sku_original)
                                    db.rollback()
                                    continue
                    
                    if not id_producto:
                        productos_omitidos.append(sku_original)
                        continue
                    
                    # Crear detalle del pedido
                    try:
                        cantidad = prod_info.get('cantidad', 0)
                        precio_unitario = prod_info.get('valor_unitario', 0)
                        
                        detalle = PedidoDetalle(
                            id_pedido=nuevo_pedido.id_pedido,
                            id_producto=id_producto,
                            cantidad=cantidad,
                            precio_unitario=precio_unitario,
                            subtotal=cantidad * precio_unitario
                        )
                        db.add(detalle)
                        productos_agregados += 1
                    except Exception as e:
                        import traceback
                        resultado['errores'].append({
                            'codigo_b2b': codigo_b2b,
                            'tipo': 'detalle_pedido',
                            'sku': sku,
                            'mensaje': f'Error al crear detalle de pedido: {str(e)}',
                            'detalle': traceback.format_exc()
                        })
                        print(f"ERROR creando detalle {sku} para {codigo_b2b}: {e}")
                        traceback.print_exc()
                        productos_omitidos.append(sku)
                        continue
                
                # Calcular montos totales basados en los productos agregados
                total_neto = 0
                for prod_info in productos_info:
                    if prod_info.get('id_producto') or (crear_productos and prod_info.get('sku')):
                        cantidad = prod_info.get('cantidad', 0)
                        precio = prod_info.get('valor_unitario', 0)
                        total_neto += cantidad * precio
                
                total_iva = total_neto * 0.19
                total_final = total_neto + total_iva
                
                nuevo_pedido.monto_neto = total_neto
                nuevo_pedido.monto_impuestos = total_iva
                nuevo_pedido.monto_total = total_final
                
                db.flush()
                
                # Construir mensaje de éxito
                if codigo_b2b_final != codigo_b2b:
                    mensaje = f"Pedido {codigo_b2b} creado exitosamente como {codigo_b2b_final} (código alternativo) con {productos_agregados} productos"
                else:
                    mensaje = f"Pedido {codigo_b2b} creado exitosamente con {productos_agregados} productos"
                
                if productos_omitidos:
                    mensaje += f". Productos omitidos: {', '.join(productos_omitidos[:3])}{'...' if len(productos_omitidos) > 3 else ''}"
                
                resultado['pedidos_creados'].append({
                    'codigo_b2b': codigo_b2b,
                    'codigo_b2b_final': codigo_b2b_final,
                    'id_pedido': nuevo_pedido.id_pedido,
                    'mensaje': mensaje,
                    'productos_count': productos_agregados,
                    'es_duplicado_diferente': pedido_info.get('es_duplicado_diferente', False)
                })
                
                # Commit por cada pedido exitoso
                db.commit()
                print(f"✅ COMMIT exitoso para pedido {codigo_b2b}")
                
            except Exception as e:
                import traceback
                db.rollback()  # Rollback del pedido con error
                print(f"🔄 ROLLBACK para pedido {codigo_b2b}")
                resultado['errores'].append({
                    'codigo_b2b': codigo_b2b,
                    'tipo': 'general',
                    'mensaje': f'Error al procesar: {str(e)}',
                    'detalle': traceback.format_exc()
                })
                print(f"ERROR GENERAL procesando {codigo_b2b}: {e}")
                traceback.print_exc()
                continue
        
        # Mensaje final
        total_creados = len(resultado['pedidos_creados'])
        total_errores = len(resultado['errores'])
        total_clientes = len(resultado['clientes_creados'])
        total_productos = len(resultado['productos_creados'])
        
        mensajes = []
        if total_creados > 0:
            mensajes.append(f"{total_creados} pedido(s) creado(s)")
        if total_clientes > 0:
            mensajes.append(f"{total_clientes} cliente(s) nuevo(s)")
        if total_productos > 0:
            mensajes.append(f"{total_productos} producto(s) nuevo(s)")
        if total_errores > 0:
            mensajes.append(f"{total_errores} error(es)")
        
        resultado['mensaje'] = '. '.join(mensajes) if mensajes else 'No se procesaron pedidos'
        
    except Exception as e:
        db.rollback()
        resultado['exito'] = False
        resultado['mensaje'] = f'Error general al procesar pedidos: {str(e)}'
    
    return resultado


def procesar_pedidos_b2b(
    db: Optional[Session] = None,
    fecha_desde: Optional[str] = None, 
    fecha_hasta: Optional[str] = None,
    remitente: str = "ventas@solomon-ti.com",
    asunto: str = '("Venta B2B Creada" OR "Venta B2B Pendiente Aprobación")'
) -> Dict:
    """
    Función principal que se conecta a Gmail, procesa los correos de pedidos
    y los registra en el sistema.
    """
    resultado = {
        'exito': True,
        'mensaje': '',
        'pedidos_procesados': [],
        'errores': []
    }
    
    try:
        service = autenticar_gmail()
        
        # --- LÓGICA DE BÚSQUEDA CORREGIDA Y MEJORADA ---
        
        # 1. Parámetros de búsqueda correctos
        query_parts = [
            f'from:"{remitente}"',
            f'subject:{asunto}'
        ]
        
        # 2. Manejo de fechas explícito y correcto
        if not fecha_desde:
            # Por defecto, busca en las últimas 24 horas.
            after_date = (datetime.now() - timedelta(days=1))
            query_parts.append(f"after:{after_date.strftime('%Y/%m/%d')}")
        else:
            after_date = datetime.strptime(fecha_desde, '%Y-%m-%d')
            query_parts.append(f"after:{after_date.strftime('%Y/%m/%d')}")

        if fecha_hasta:
            # La API de Gmail con 'before' excluye el día. Para incluir la fecha_hasta
            # completa, debemos apuntar al día siguiente.
            before_date = datetime.strptime(fecha_hasta, '%Y-%m-%d') + timedelta(days=1)
            query_parts.append(f"before:{before_date.strftime('%Y/%m/%d')}")

        query = " ".join(query_parts)
        
        # Mensaje de depuración para máxima claridad
        print(f"DEBUG: Ejecutando consulta en Gmail: '{query}'")
        
        # Buscar correos
        response = service.users().messages().list(userId='me', q=query).execute()
        messages = response.get('messages', [])
        
        if not messages:
            resultado['mensaje'] = f"No se encontraron correos para la consulta: '{query}'"
            return resultado
            
        # --- El resto de la función para procesar los correos sigue igual ---
        
        total_mensajes = len(messages)
        print(f"INFO: Se encontraron {total_mensajes} correos para procesar.")

        for i, msg in enumerate(messages):
            codigo_b2b_actual = 'desconocido'
            try:
                print(f"Procesando correo {i+1}/{total_mensajes}...")
                msg_data = service.users().messages().get(userId='me', id=msg['id'], format='full').execute()
                payload = msg_data['payload']
                headers = payload['headers']
                
                subject = next((h['value'] for h in headers if h['name'] == 'Subject'), '')
                codigo_b2b_actual = extraer_campo(subject, r'Nº ([A-Z0-9]+)', 'No encontrado')
                
                if codigo_b2b_actual == 'No encontrado' or not codigo_b2b_actual:
                    error_msg = 'No se pudo extraer el código B2B del asunto'
                    resultado['errores'].append({'mensaje': error_msg, 'asunto': subject})
                    print(f"ERROR: {error_msg} - Asunto: '{subject}'")
                    continue
                
                # Decodificar cuerpo del correo
                if 'parts' in payload:
                    part = next((p for p in payload['parts'] if p['mimeType'] == 'text/html'), None)
                    if not part:
                        error_msg = 'No se encontró parte HTML en el correo'
                        resultado['errores'].append({'codigo_b2b': codigo_b2b_actual, 'mensaje': error_msg})
                        print(f"ERROR: {error_msg} (Pedido: {codigo_b2b_actual})")
                        continue
                    
                    data = base64.urlsafe_b64decode(part['body']['data']).decode('utf-8')
                    soup = BeautifulSoup(data, 'html.parser')
                    texto_plano_correo = soup.get_text()
                    
                    info_cliente = extraer_info_cliente(texto_plano_correo)
                    productos_extraidos = extraer_tabla_productos(soup)
                    
                    if not productos_extraidos:
                        error_msg = 'No se encontraron productos en la tabla del correo'
                        resultado['errores'].append({'codigo_b2b': codigo_b2b_actual, 'mensaje': error_msg})
                        print(f"ADVERTENCIA: {error_msg} (Pedido: {codigo_b2b_actual})")
                        continue
                    
                    datos_pedido = {
                        'codigo_b2b': codigo_b2b_actual,
                        'fecha_pedido': datetime.now(),
                        'info_cliente': info_cliente,
                        'observaciones': f"Dirección: {info_cliente.get('direccion', 'N/A')}, Comuna: {info_cliente.get('comuna', 'N/A')}"
                    }
                    
                    if db:
                        exito, mensaje, id_pedido = registrar_pedido_en_sistema(datos_pedido, productos_extraidos, db)
                        if exito:
                            resultado['pedidos_procesados'].append({'codigo_b2b': codigo_b2b_actual, 'id_pedido': id_pedido, 'mensaje': mensaje})
                        else:
                            resultado['errores'].append({'codigo_b2b': codigo_b2b_actual, 'mensaje': mensaje})
                    else:
                        resultado['pedidos_procesados'].append({'codigo_b2b': codigo_b2b_actual, 'info_cliente': info_cliente, 'productos': productos_extraidos})
                
            except Exception as e:
                error_msg = f'Error inesperado procesando correo: {str(e)}'
                resultado['errores'].append({'codigo_b2b': codigo_b2b_actual, 'mensaje': error_msg})
                print(f"ERROR GRAVE: {error_msg} (Pedido: {codigo_b2b_actual})")
                continue
        
        msg_exitosos = f"Se procesaron {len(resultado['pedidos_procesados'])} pedidos."
        msg_errores = f"Se encontraron {len(resultado['errores'])} errores."
        resultado['mensaje'] = f"{msg_exitosos} {msg_errores}"
    
    except HttpError as error:
        resultado['exito'] = False
        resultado['mensaje'] = f'Error de Gmail API: {str(error)}'
    except FileNotFoundError as error:
        resultado['exito'] = False
        resultado['mensaje'] = str(error)
    except Exception as e:
        resultado['exito'] = False
        resultado['mensaje'] = f'Error inesperado general: {str(e)}'
    
    return resultado


if __name__ == '__main__':
    # Esto permite ejecutar el script directamente para una prueba
    resultado = procesar_pedidos_b2b()
    print(resultado)

