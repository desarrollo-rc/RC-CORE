"""
Script para importar clientes y usuarios B2B desde el CSV generado por la automatización.

Este script:
1. Lee el CSV de clientes_usuarios_b2b.csv
2. Agrupa por cliente (RUT)
3. Crea clientes faltantes en RC CORE con valores por defecto
4. Crea usuarios B2B faltantes para cada cliente

Datos faltantes y cómo se manejan:
- codigo_cliente: Se genera automáticamente como "C{rut_cliente}"
- email (usuarios): Se genera como "{username}@repuestoscenter.cl"
- password (usuarios): Se genera como "{username}.,2025.*"
- Valores por defecto para FK: Se pueden configurar al inicio del script
"""

import csv
import sys
from pathlib import Path
from collections import defaultdict
from decimal import Decimal
import re

# Agregar el path del backend al sys.path para importar los modelos
backend_path = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_path))

from app import create_app
from app.extensions import db
from app.models.entidades.maestro_clientes import MaestroClientes
from app.models.entidades.usuarios_b2b import UsuarioB2B
from app.models.entidades.usuarios import Usuario
from app.models.entidades.entidades_auxiliares import (
    TipoCliente, SegmentoCliente, ListaPrecios, CondicionPago
)
from app.models.entidades.tipo_negocio import TipoNegocio

# ============================================================================
# CONFIGURACIÓN: Valores por defecto para campos faltantes
# ============================================================================

# Códigos por defecto para las entidades relacionadas (ajustar según tu BD)
DEFAULT_CODIGO_TIPO_CLIENTE = -1 # Ajustar según exista en tu BD
DEFAULT_CODIGO_SEGMENTO_CLIENTE = -1  # Ajustar según exista en tu BD
DEFAULT_CODIGO_TIPO_NEGOCIO = -1  # Ajustar según exista en tu BD
DEFAULT_CODIGO_LISTA_PRECIOS = -1  # Ajustar según exista en tu BD

# Código de condición de pago por defecto cuando no se encuentra la específica (None = dejar NULL)
DEFAULT_CODIGO_CONDICION_PAGO = None  # Ajustar si quieres asignar una por defecto (ej: "CONTADO", "30", etc.)

# Dominio para generar emails de usuarios B2B
EMAIL_DOMAIN = "repuestoscenter.cl"

# Formato de password: {username}.,{año}.*
PASSWORD_YEAR = 2025

# ID del usuario que creará los registros (None = buscar el primer usuario activo)
ID_USUARIO_CREACION = None


# ============================================================================
# FUNCIONES AUXILIARES
# ============================================================================

def limpiar_rut(rut: str) -> str:
    """Limpia y normaliza un RUT: remueve espacios, puntos y normaliza a mayúsculas.
    
    Ejemplos:
    - "77.105.708-K" -> "77105708-K"
    - "77105708-k" -> "77105708-K"
    - "77105708 - K" -> "77105708-K"
    """
    if not rut:
        return ""
    # Remover espacios, puntos y normalizar a mayúsculas
    rut_limpio = rut.replace('.', '').replace(' ', '').strip().upper()
    return rut_limpio


def generar_codigo_cliente(rut: str) -> str:
    """Genera un código de cliente desde el RUT: C{rut}"""
    rut_limpio = limpiar_rut(rut)
    return f"C{rut_limpio}"


def limpiar_linea_credito(linea_str: str) -> Decimal:
    """Convierte '65.000.000' a Decimal(65000000)"""
    if not linea_str or linea_str.strip() == '':
        return Decimal('0')
    # Remover puntos (separadores de miles) y convertir
    numero_limpio = linea_str.replace('.', '').strip()
    try:
        return Decimal(numero_limpio)
    except:
        return Decimal('0')


def mapear_condicion_pago(condicion_texto: str) -> tuple:
    """
    Mapea el texto de condición de pago del CSV a un código y días de crédito.
    Retorna: (codigo, dias_credito) o (None, None)
    Ejemplos: 
    - "30 Dias" -> ("30", 30)
    - "45, 60, 75, 90 dias" -> ("45-90", 45)
    """
    if not condicion_texto:
        return None, None
    
    # Extraer números del texto
    numeros = re.findall(r'\d+', condicion_texto)
    if numeros:
        dias_credito = int(numeros[0])  # Tomar el primer número como días de crédito
        # Si hay múltiples, crear un código compuesto
        if len(numeros) > 1:
            codigo = f"{numeros[0]}-{numeros[-1]}"
        else:
            codigo = numeros[0]
        return codigo, dias_credito
    return None, None


def crear_o_obtener_condicion_pago(codigo: str, dias_credito: int, condicion_texto: str):
    """
    Crea una condición de pago si no existe, o la obtiene si ya existe.
    Retorna: (CondicionPago, es_nueva)
    """
    if not codigo:
        return None, False
    
    # Buscar condición existente
    condicion = CondicionPago.get_by_codigo(codigo)
    
    if condicion:
        return condicion, False
    
    # Crear nueva condición de pago
    nombre = f"{dias_credito} Días" if dias_credito > 0 else "Contado"
    if len(codigo.split('-')) > 1:
        # Si es un rango, usar el texto original
        nombre = condicion_texto if condicion_texto else nombre
    
    nueva_condicion = CondicionPago(
        codigo_condicion_pago=codigo.upper(),
        nombre_condicion_pago=nombre,
        descripcion_condicion_pago=f"Condición de pago: {condicion_texto}",
        dias_credito=dias_credito,
        ambito='VENTA'
    )
    
    db.session.add(nueva_condicion)
    db.session.flush()
    
    print(f"    ✓ Condición de pago creada: {codigo} ({dias_credito} días)")
    
    return nueva_condicion, True


def generar_email_usuario(username: str) -> str:
    """Genera un email para un usuario B2B."""
    return f"{username.lower()}@{EMAIL_DOMAIN}"


def generar_password_usuario(username: str) -> str:
    """Genera una password temporal para un usuario B2B."""
    return f"{username}.,{PASSWORD_YEAR}.*"


def obtener_id_usuario_creacion():
    """Obtiene el ID del usuario que creará los registros."""
    if ID_USUARIO_CREACION:
        usuario = Usuario.query.get(ID_USUARIO_CREACION)
        if usuario:
            return ID_USUARIO_CREACION
        print(f"⚠️  Advertencia: ID_USUARIO_CREACION={ID_USUARIO_CREACION} no existe, buscando alternativo...")
    
    # Buscar el primer usuario activo
    usuario = Usuario.query.filter_by(activo=True).first()
    if usuario:
        return usuario.id_usuario
    
    raise Exception("No se encontró ningún usuario activo para id_usuario_creacion")


def obtener_entidades_por_defecto():
    """Obtiene las entidades relacionadas usando los códigos o IDs por defecto.
    
    Si el valor es un entero, busca por ID.
    Si el valor es un string, busca por código.
    """
    # Tipo Cliente
    if isinstance(DEFAULT_CODIGO_TIPO_CLIENTE, int):
        tipo_cliente = TipoCliente.query.get(DEFAULT_CODIGO_TIPO_CLIENTE)
        tipo_cliente_label = f"ID {DEFAULT_CODIGO_TIPO_CLIENTE}"
    else:
        tipo_cliente = TipoCliente.get_by_codigo(DEFAULT_CODIGO_TIPO_CLIENTE)
        tipo_cliente_label = f"código '{DEFAULT_CODIGO_TIPO_CLIENTE}'"
    
    # Segmento Cliente
    if isinstance(DEFAULT_CODIGO_SEGMENTO_CLIENTE, int):
        segmento_cliente = SegmentoCliente.query.get(DEFAULT_CODIGO_SEGMENTO_CLIENTE)
        segmento_cliente_label = f"ID {DEFAULT_CODIGO_SEGMENTO_CLIENTE}"
    else:
        segmento_cliente = SegmentoCliente.get_by_codigo(DEFAULT_CODIGO_SEGMENTO_CLIENTE)
        segmento_cliente_label = f"código '{DEFAULT_CODIGO_SEGMENTO_CLIENTE}'"
    
    # Tipo Negocio
    if isinstance(DEFAULT_CODIGO_TIPO_NEGOCIO, int):
        tipo_negocio = TipoNegocio.query.get(DEFAULT_CODIGO_TIPO_NEGOCIO)
        tipo_negocio_label = f"ID {DEFAULT_CODIGO_TIPO_NEGOCIO}"
    else:
        tipo_negocio = TipoNegocio.get_by_codigo(DEFAULT_CODIGO_TIPO_NEGOCIO)
        tipo_negocio_label = f"código '{DEFAULT_CODIGO_TIPO_NEGOCIO}'"
    
    # Lista Precios
    if isinstance(DEFAULT_CODIGO_LISTA_PRECIOS, int):
        lista_precios = ListaPrecios.query.get(DEFAULT_CODIGO_LISTA_PRECIOS)
        lista_precios_label = f"ID {DEFAULT_CODIGO_LISTA_PRECIOS}"
    else:
        lista_precios = ListaPrecios.get_by_codigo(DEFAULT_CODIGO_LISTA_PRECIOS)
        lista_precios_label = f"código '{DEFAULT_CODIGO_LISTA_PRECIOS}'"
    
    faltantes = []
    if not tipo_cliente:
        faltantes.append(f"TipoCliente con {tipo_cliente_label}")
    if not segmento_cliente:
        faltantes.append(f"SegmentoCliente con {segmento_cliente_label}")
    if not tipo_negocio:
        faltantes.append(f"TipoNegocio con {tipo_negocio_label}")
    if not lista_precios:
        faltantes.append(f"ListaPrecios con {lista_precios_label}")
    
    if faltantes:
        raise Exception(f"Faltan las siguientes entidades en la BD: {', '.join(faltantes)}")
    
    return {
        'tipo_cliente': tipo_cliente,
        'segmento_cliente': segmento_cliente,
        'tipo_negocio': tipo_negocio,
        'lista_precios': lista_precios,
    }


# ============================================================================
# FUNCIONES DE IMPORTACIÓN
# ============================================================================

def leer_csv(ruta_csv: Path):
    """Lee el CSV y agrupa los datos por cliente (RUT)."""
    clientes_data = defaultdict(lambda: {
        'info': None,
        'usuarios': []
    })
    
    with open(ruta_csv, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            rut = limpiar_rut(row['rut_cliente'])
            
            # Guardar info del cliente (solo la primera vez)
            if clientes_data[rut]['info'] is None:
                clientes_data[rut]['info'] = {
                    'rut_cliente': rut,
                    'nombre_cliente': row['nombre_cliente'].strip(),
                    'condicion_pago': row['condicion_pago'].strip(),
                    'linea_credito': limpiar_linea_credito(row['linea_credito']),
                    'estado_cliente': row['estado_cliente'].strip(),
                }
            
            # Agregar usuario
            clientes_data[rut]['usuarios'].append({
                'username': row['username'].strip(),
                'nombre_usuario': row['nombre_usuario'].strip(),
                'fecha_ultima_modificacion': row['fecha_ultima_modificacion'].strip(),
                'estado_usuario': row['estado_usuario'].strip(),
            })
    
    return clientes_data


def crear_o_obtener_cliente(cliente_data, entidades_def, id_usuario_creacion):
    """Crea un cliente si no existe, o lo obtiene si ya existe.
    
    Retorna: (cliente, es_nuevo)
    """
    rut = cliente_data['rut_cliente']
    rut_normalizado = limpiar_rut(rut)
    
    # Buscar cliente existente por RUT (búsqueda exacta primero)
    cliente_existente = MaestroClientes.query.filter_by(rut_cliente=rut_normalizado).first()
    
    # Si no se encuentra, intentar búsqueda flexible normalizando RUTs de la BD
    if not cliente_existente:
        # Obtener todos los clientes y comparar RUTs normalizados
        # Esto es necesario porque la BD puede tener RUTs con formato diferente
        from sqlalchemy import func
        # Primero intentar búsqueda case-insensitive con normalización en SQL
        cliente_existente = MaestroClientes.query.filter(
            func.upper(func.replace(func.replace(MaestroClientes.rut_cliente, '.', ''), ' ', '')) == rut_normalizado
        ).first()
        
        # Si aún no se encuentra, buscar todos y comparar normalizados
        if not cliente_existente:
            # Buscar solo los que empiezan con los mismos números (más eficiente)
            rut_sin_dv = rut_normalizado.split('-')[0] if '-' in rut_normalizado else rut_normalizado[:-1]
            clientes_candidatos = MaestroClientes.query.filter(
                MaestroClientes.rut_cliente.like(f'{rut_sin_dv}%')
            ).all()
            
            for cliente_bd in clientes_candidatos:
                rut_bd_normalizado = limpiar_rut(cliente_bd.rut_cliente)
                if rut_bd_normalizado == rut_normalizado:
                    cliente_existente = cliente_bd
                    print(f"  🔍 Cliente encontrado con búsqueda flexible: '{rut}' (BD tenía: '{cliente_bd.rut_cliente}')")
                    break
    
    if cliente_existente:
        print(f"  ✓ Cliente ya existe: {rut_normalizado} - {cliente_existente.nombre_cliente} (ID: {cliente_existente.id_cliente})")
        
        actualizado = False
        
        # Actualizar línea de crédito si es diferente
        if cliente_existente.linea_credito != cliente_data['linea_credito']:
            print(f"    → Actualizando línea de crédito: {cliente_existente.linea_credito} → {cliente_data['linea_credito']}")
            cliente_existente.linea_credito = cliente_data['linea_credito']
            actualizado = True
        
        # Actualizar condición de pago
        codigo_condicion, dias_credito = mapear_condicion_pago(cliente_data['condicion_pago'])
        if codigo_condicion:
            resultado = crear_o_obtener_condicion_pago(
                codigo_condicion, 
                dias_credito, 
                cliente_data['condicion_pago']
            )
            if resultado:
                condicion_pago, condicion_es_nueva = resultado
                if condicion_es_nueva:
                    # Se contará en el resumen final
                    pass
                if cliente_existente.id_condicion_pago != condicion_pago.id_condicion_pago:
                    print(f"    → Actualizando condición de pago: {condicion_pago.codigo_condicion_pago}")
                    cliente_existente.id_condicion_pago = condicion_pago.id_condicion_pago
                    actualizado = True
        
        # Si no tiene B2B habilitado, habilitarlo
        if not cliente_existente.b2b_habilitado:
            cliente_existente.b2b_habilitado = True
            actualizado = True
            print(f"    → B2B habilitado para este cliente")
        
        if actualizado:
            db.session.commit()
        
        return cliente_existente, False
    
    # Crear nuevo cliente
    codigo_cliente = generar_codigo_cliente(rut)
    
    # Verificar que el código no exista
    if MaestroClientes.query.filter_by(codigo_cliente=codigo_cliente).first():
        # Si existe, agregar un sufijo
        contador = 1
        while MaestroClientes.query.filter_by(codigo_cliente=f"{codigo_cliente}_{contador}").first():
            contador += 1
        codigo_cliente = f"{codigo_cliente}_{contador}"
    
    # Mapear y crear/obtener condición de pago
    codigo_condicion, dias_credito = mapear_condicion_pago(cliente_data['condicion_pago'])
    condicion_pago = None
    if codigo_condicion:
        resultado = crear_o_obtener_condicion_pago(
            codigo_condicion,
            dias_credito,
            cliente_data['condicion_pago']
        )
        if resultado:
            condicion_pago, _ = resultado
    elif DEFAULT_CODIGO_CONDICION_PAGO:
        # Si no se pudo mapear pero hay una por defecto, usarla
        condicion_pago = CondicionPago.get_by_codigo(DEFAULT_CODIGO_CONDICION_PAGO)
        if condicion_pago:
            print(f"    → Usando condición de pago por defecto: {DEFAULT_CODIGO_CONDICION_PAGO}")
        else:
            print(f"    ⚠️  Condición de pago por defecto '{DEFAULT_CODIGO_CONDICION_PAGO}' no existe, se dejará NULL")
    
    nuevo_cliente = MaestroClientes(
        codigo_cliente=codigo_cliente,
        rut_cliente=rut,
        nombre_cliente=cliente_data['nombre_cliente'],
        linea_credito=cliente_data['linea_credito'],
        activo=(cliente_data['estado_cliente'].lower() == 'activo'),
        b2b_habilitado=True,  # Si tiene usuarios B2B, debe estar habilitado
        id_tipo_cliente=entidades_def['tipo_cliente'].id_tipo_cliente,
        id_segmento_cliente=entidades_def['segmento_cliente'].id_segmento_cliente,
        id_tipo_negocio=entidades_def['tipo_negocio'].id_tipo_negocio,
        id_lista_precios=entidades_def['lista_precios'].id_lista_precios,
        id_condicion_pago=condicion_pago.id_condicion_pago if condicion_pago else None,
        id_usuario_creacion=id_usuario_creacion,
    )
    
    db.session.add(nuevo_cliente)
    db.session.flush()  # Para obtener el ID
    
    print(f"  ✓ Cliente creado: {rut} - {cliente_data['nombre_cliente']} (ID: {nuevo_cliente.id_cliente}, Código: {codigo_cliente})")
    
    return nuevo_cliente, True


def crear_o_obtener_usuario_b2b(usuario_data, id_cliente):
    """Crea un usuario B2B si no existe, o lo obtiene si ya existe.
    
    Retorna: (usuario, es_nuevo) o (None, False) si hay conflicto
    """
    username = usuario_data['username'].lower().strip()
    
    # Buscar usuario existente (búsqueda exacta primero)
    usuario_existente = UsuarioB2B.query.filter_by(usuario=username).first()
    
    # Si no se encuentra, intentar búsqueda flexible normalizando usernames de la BD
    if not usuario_existente:
        # Buscar todos los usuarios y comparar usernames normalizados
        todos_usuarios = UsuarioB2B.query.all()
        for usuario_bd in todos_usuarios:
            username_bd_normalizado = usuario_bd.usuario.lower().strip() if usuario_bd.usuario else ""
            if username_bd_normalizado == username:
                usuario_existente = usuario_bd
                print(f"    🔍 Usuario encontrado con búsqueda flexible: {username} (BD tenía: {usuario_bd.usuario})")
                break
    
    if usuario_existente:
        # Verificar que pertenezca al mismo cliente
        if usuario_existente.id_cliente != id_cliente:
            print(f"    ⚠️  Usuario '{username}' ya existe pero pertenece a otro cliente (ID: {usuario_existente.id_cliente})")
            return None, False
        
        # Actualizar estado del usuario basado en el CSV
        estado_csv = usuario_data.get('estado_usuario', '').strip().lower()
        activo_csv = estado_csv == 'activo'
        
        if usuario_existente.activo != activo_csv:
            estado_anterior = 'Activo' if usuario_existente.activo else 'Inactivo'
            estado_nuevo = 'Activo' if activo_csv else 'Inactivo'
            print(f"    → Actualizando estado del usuario: {estado_anterior} → {estado_nuevo}")
            usuario_existente.activo = activo_csv
        
        print(f"    ✓ Usuario ya existe: {username} - {usuario_existente.nombre_completo} (Estado: {'Activo' if usuario_existente.activo else 'Inactivo'})")
        return usuario_existente, False
    
    # Crear nuevo usuario
    email = generar_email_usuario(username)
    
    # Verificar que el email no exista
    if UsuarioB2B.query.filter_by(email=email).first():
        # Si existe, agregar un número
        contador = 1
        while UsuarioB2B.query.filter_by(email=f"{username}{contador}@{EMAIL_DOMAIN}").first():
            contador += 1
        email = f"{username}{contador}@{EMAIL_DOMAIN}"
    
    password = generar_password_usuario(username)
    
    # Determinar estado del usuario basado en el CSV
    estado_csv = usuario_data.get('estado_usuario', '').strip().lower()
    activo = estado_csv == 'activo'
    
    nuevo_usuario = UsuarioB2B(
        nombre_completo=usuario_data['nombre_usuario'],
        usuario=username,
        email=email,
        id_cliente=id_cliente,
        activo=activo,
    )
    nuevo_usuario.set_password(password)
    
    db.session.add(nuevo_usuario)
    db.session.flush()
    
    estado_texto = 'Activo' if activo else 'Inactivo'
    print(f"    ✓ Usuario creado: {username} - {usuario_data['nombre_usuario']} (Email: {email}, Estado: {estado_texto}, Password: {password})")
    
    return nuevo_usuario, True


def importar_datos(ruta_csv: Path, dry_run: bool = False, debug: bool = False):
    """Función principal de importación."""
    print("=" * 80)
    print("IMPORTACIÓN DE CLIENTES Y USUARIOS B2B")
    print("=" * 80)
    print(f"CSV: {ruta_csv}")
    print(f"Modo: {'DRY RUN (sin guardar)' if dry_run else 'IMPORTACIÓN REAL'}")
    print("=" * 80)
    print()
    
    # Validar que existe el CSV
    if not ruta_csv.exists():
        raise FileNotFoundError(f"El archivo CSV no existe: {ruta_csv}")
    
    # Obtener entidades por defecto
    print("Obteniendo entidades por defecto...")
    try:
        entidades_def = obtener_entidades_por_defecto()
        print(f"  ✓ Tipo Cliente: {entidades_def['tipo_cliente'].nombre_tipo_cliente}")
        print(f"  ✓ Segmento Cliente: {entidades_def['segmento_cliente'].nombre_segmento_cliente}")
        print(f"  ✓ Tipo Negocio: {entidades_def['tipo_negocio'].nombre_tipo_negocio}")
        print(f"  ✓ Lista Precios: {entidades_def['lista_precios'].nombre_lista_precios}")
    except Exception as e:
        print(f"  ❌ Error: {e}")
        print("\n💡 Ajusta los valores DEFAULT_CODIGO_* al inicio del script según tu BD.")
        return
    
    # Obtener ID de usuario de creación
    try:
        id_usuario_creacion = obtener_id_usuario_creacion()
        usuario_creacion = Usuario.query.get(id_usuario_creacion)
        print(f"  ✓ Usuario de creación: {usuario_creacion.nombre_completo} (ID: {id_usuario_creacion})")
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return
    
    print()
    
    # Leer CSV
    print("Leyendo CSV...")
    clientes_data = leer_csv(ruta_csv)
    print(f"  ✓ {len(clientes_data)} clientes únicos encontrados")
    total_usuarios = sum(len(data['usuarios']) for data in clientes_data.values())
    print(f"  ✓ {total_usuarios} usuarios totales")
    
    # Modo debug: mostrar algunos RUTs del CSV y comparar con BD
    if debug:
        print("\n🔍 MODO DEBUG: Verificando RUTs...")
        ruts_csv = list(clientes_data.keys())[:5]  # Primeros 5 RUTs del CSV
        print(f"  Primeros 5 RUTs del CSV (normalizados): {ruts_csv}")
        
        # Buscar en BD
        clientes_bd = MaestroClientes.query.limit(10).all()
        ruts_bd = [limpiar_rut(c.rut_cliente) for c in clientes_bd]
        print(f"  Primeros 10 RUTs de la BD (normalizados): {ruts_bd}")
        
        # Test específico para el RUT conocido
        rut_test = "77105708-K"
        rut_test_normalizado = limpiar_rut(rut_test)
        print(f"\n  Test específico para RUT: {rut_test}")
        print(f"    RUT normalizado: '{rut_test_normalizado}'")
        
        # Buscar en BD
        cliente_test = MaestroClientes.query.filter_by(rut_cliente=rut_test_normalizado).first()
        if cliente_test:
            print(f"    ✓ Encontrado con búsqueda exacta: {cliente_test.nombre_cliente}")
        else:
            print(f"    ❌ NO encontrado con búsqueda exacta")
            # Buscar con normalización
            from sqlalchemy import func
            cliente_test = MaestroClientes.query.filter(
                func.upper(func.replace(func.replace(MaestroClientes.rut_cliente, '.', ''), ' ', '')) == rut_test_normalizado
            ).first()
            if cliente_test:
                print(f"    ✓ Encontrado con búsqueda normalizada: {cliente_test.nombre_cliente} (RUT en BD: '{cliente_test.rut_cliente}')")
            else:
                print(f"    ❌ NO encontrado con búsqueda normalizada")
                # Buscar todos los que contengan 77105708
                clientes_77105708 = MaestroClientes.query.filter(
                    MaestroClientes.rut_cliente.like('%77105708%')
                ).all()
                print(f"    Clientes con '77105708' en RUT: {len(clientes_77105708)}")
                for c in clientes_77105708:
                    print(f"      - RUT: '{c.rut_cliente}' (normalizado: '{limpiar_rut(c.rut_cliente)}') - {c.nombre_cliente}")
        
        # Verificar coincidencias
        coincidencias = [rut for rut in ruts_csv if rut in ruts_bd]
        print(f"\n  Coincidencias encontradas: {len(coincidencias)}/{len(ruts_csv)}")
        if coincidencias:
            print(f"    RUTs que coinciden: {coincidencias}")
        print()
    
    # Estadísticas
    stats = {
        'clientes_creados': 0,
        'clientes_existentes': 0,
        'clientes_actualizados': 0,
        'usuarios_creados': 0,
        'usuarios_existentes': 0,
        'condiciones_creadas': 0,
        'errores': []
    }
    
    # Procesar cada cliente
    print("Procesando clientes y usuarios...")
    print("-" * 80)
    
    for rut, data in clientes_data.items():
        print(f"\n📋 Cliente: {rut} - {data['info']['nombre_cliente']}")
        print(f"   Usuarios en CSV: {len(data['usuarios'])}")
        
        try:
            if dry_run:
                print("  [DRY RUN] Se crearía el cliente y sus usuarios")
                stats['clientes_creados'] += 1
                stats['usuarios_creados'] += len(data['usuarios'])
            else:
                # Crear u obtener cliente
                cliente, cliente_es_nuevo = crear_o_obtener_cliente(
                    data['info'],
                    entidades_def,
                    id_usuario_creacion
                )
                
                if cliente_es_nuevo:
                    stats['clientes_creados'] += 1
                else:
                    stats['clientes_existentes'] += 1
                    # Verificar si se actualizó algo
                    if cliente.linea_credito != data['info']['linea_credito'] or \
                       (cliente.id_condicion_pago is None and mapear_condicion_pago(data['info']['condicion_pago'])[0]):
                        stats['clientes_actualizados'] += 1
                
                # Crear usuarios
                for usuario_data in data['usuarios']:
                    try:
                        resultado = crear_o_obtener_usuario_b2b(usuario_data, cliente.id_cliente)
                        if resultado:
                            usuario, usuario_es_nuevo = resultado
                            if usuario_es_nuevo:
                                stats['usuarios_creados'] += 1
                            else:
                                stats['usuarios_existentes'] += 1
                    except Exception as e:
                        error_msg = f"Error creando usuario {usuario_data['username']}: {e}"
                        print(f"    ❌ {error_msg}")
                        stats['errores'].append(error_msg)
                
                # Contar condiciones de pago creadas en este cliente (ya se crearon arriba si era necesario)
                # El contador se incrementa cuando se crea la condición
                
                # Commit después de cada cliente
                db.session.commit()
                
        except Exception as e:
            error_msg = f"Error procesando cliente {rut}: {e}"
            print(f"  ❌ {error_msg}")
            stats['errores'].append(error_msg)
            db.session.rollback()
    
    # Resumen final
    print()
    print("=" * 80)
    print("RESUMEN DE IMPORTACIÓN")
    print("=" * 80)
    print(f"Clientes creados: {stats['clientes_creados']}")
    print(f"Clientes existentes: {stats['clientes_existentes']}")
    if stats['clientes_actualizados'] > 0:
        print(f"Clientes actualizados: {stats['clientes_actualizados']}")
    if stats['condiciones_creadas'] > 0:
        print(f"Condiciones de pago creadas: {stats['condiciones_creadas']}")
    print(f"Usuarios creados: {stats['usuarios_creados']}")
    print(f"Usuarios existentes: {stats['usuarios_existentes']}")
    if stats['errores']:
        print(f"\n⚠️  Errores ({len(stats['errores'])}):")
        for error in stats['errores'][:10]:  # Mostrar solo los primeros 10
            print(f"  - {error}")
        if len(stats['errores']) > 10:
            print(f"  ... y {len(stats['errores']) - 10} errores más")
    print("=" * 80)


# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Importar clientes y usuarios B2B desde CSV')
    parser.add_argument(
        '--csv',
        type=Path,
        default=Path(__file__).parent / 'clientes_usuarios_b2b.csv',
        help='Ruta al archivo CSV (default: clientes_usuarios_b2b.csv)'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Ejecutar sin guardar cambios (solo mostrar qué se haría)'
    )
    parser.add_argument(
        '--debug',
        action='store_true',
        help='Mostrar información de debug sobre búsquedas'
    )
    
    args = parser.parse_args()
    
    # Crear app Flask
    app = create_app()
    
    with app.app_context():
        try:
            importar_datos(args.csv, dry_run=args.dry_run, debug=args.debug)
        except Exception as e:
            print(f"\n❌ Error fatal: {e}")
            import traceback
            traceback.print_exc()
            sys.exit(1)

