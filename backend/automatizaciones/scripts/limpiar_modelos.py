import pandas as pd
import re
import sys
import os
import tkinter as tk
from tkinter import filedialog
from collections import defaultdict

# Ajustar el path para poder importar la app de Flask cuando el script se ejecuta directamente
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "..", ".."))
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

from app import create_app
from app.extensions import db
from app.models.productos import Marca, Modelo
from sqlalchemy import func

def limpiar_nombre_modelo(row):
    """
    Lógica de limpieza: Elimina el nombre de la marca de CUALQUIER PARTE
    del nombre del modelo.
    """
    try:
        # Aseguramos que ambos sean strings y quitamos espacios
        modelo_antiguo = str(row['Modelo']).strip()
        marca = str(row['Marca']).strip()

        # Si no hay marca o no hay modelo, no podemos limpiar.
        if not marca or not modelo_antiguo:
            return modelo_antiguo

        # --- INICIO DE LA MODIFICACIÓN ---

        # 1. Lógica de Regex:
        #    Hemos quitado el ancla de inicio (el '^')
        #    Ahora, 'marca' se eliminará de CUALQUIER LUGAR donde aparezca.
        
        modelo_limpio = re.sub(f'{re.escape(marca)}', '', modelo_antiguo, flags=re.IGNORECASE).strip()
        
        # 2. Post-limpieza de espacios:
        #    Esto colapsará espacios dobles (ej. "DEER  2.2") a "DEER 2.2"
        
        modelo_limpio = re.sub(r'\s+', ' ', modelo_limpio).strip()
        
        # 3. Post-limpieza de caracteres sobrantes al inicio:
        
        modelo_limpio = modelo_limpio.lstrip(' -')

        # --- FIN DE LA MODIFICACIÓN ---

        # Caso borde: Si el modelo era SÓLO la marca
        if not modelo_limpio:
            return modelo_antiguo

        return modelo_limpio

    except Exception as e:
        print(f"Error procesando fila {row.get('CODIGO MODELO', 'N/A')}: {e}")
        return row.get('Modelo', None)

def seleccionar_archivo():
    """
    Abre una ventana de diálogo para que el usuario seleccione el archivo.
    """
    print("Por favor, selecciona tu archivo de modelos (CSV o Excel)...")
    root = tk.Tk()
    root.withdraw()  # Oculta la ventana principal de tkinter
    
    file_path = filedialog.askopenfilename(
        title="Seleccionar archivo de Modelos Legacy",
        filetypes=[("Archivos CSV", "*.csv"), 
                   ("Archivos Excel", "*.xlsx"), 
                   ("Todos los archivos", "*.*")]
    )
    
    if not file_path:
        print("Operación cancelada. Saliendo del script.")
        sys.exit(0)
        
    return file_path

def procesar_modelos():
    """
    Función principal del script ETL.
    """
    # 1. SELECCIÓN DE ARCHIVO
    archivo_entrada = seleccionar_archivo()
    print(f"Archivo seleccionado: '{archivo_entrada}'")

    # Definir el nombre del archivo de salida
    # Se guardará en la misma carpeta del archivo original
    base_name = os.path.basename(archivo_entrada)
    name_sin_ext, _ = os.path.splitext(base_name)
    dir_name = os.path.dirname(archivo_entrada)
    
    # El archivo de salida SIEMPRE será un Excel
    archivo_salida = os.path.join(dir_name, f"{name_sin_ext}_LIMPIO.xlsx")

    try:
        # 2. EXTRACT: Cargar el archivo
        print(f"Cargando archivo...")
        
        # Detección automática de tipo de archivo (basado en el archivo que subiste)
        if archivo_entrada.endswith('.csv'):
            df = pd.read_csv(archivo_entrada, dtype=str)
        elif archivo_entrada.endswith('.xlsx'):
            df = pd.read_excel(archivo_entrada, dtype=str)
        else:
            print(f"Error: Tipo de archivo '{os.path.splitext(archivo_entrada)[1]}' no soportado.")
            sys.exit(1)
            
        print(f"Se encontraron {len(df)} filas.")

    except Exception as e:
        print(f"¡Error inesperado al leer el archivo! {e}")
        sys.exit(1)

    columnas_limpias = ['Código Modelo', 'Marca', 'Modelo', 'Nombre Antiguo']
    columnas_crudas = ['CODIGO MODELO', 'Marca', 'Modelo']

    datos_ya_limpios = all(col in df.columns for col in columnas_limpias)
    datos_crudos = all(col in df.columns for col in columnas_crudas)

    if datos_ya_limpios:
        print("Se detectó un archivo ya limpio con columnas finales. Se omitirá la etapa de limpieza.")
        df_salida_final = df[columnas_limpias].copy()
        archivo_salida = os.path.join(dir_name, f"{name_sin_ext}_FINAL.xlsx")
    elif datos_crudos:
        print("Iniciando Transformación (ETL)...")
        
        # Paso 3.1: Crear el "puente" (Nombre Antiguo)
        df['Nombre Antiguo'] = df['Modelo']
        
        # Paso 3.2: Aplicar la función de limpieza fila por fila
        print("Limpiando nombres de modelos (removiendo marcas duplicadas)...")
        df['Modelo Limpio'] = df.apply(limpiar_nombre_modelo, axis=1)

        # Reporte de cambios (Visión de Gerencia/KPIs)
        cambios_realizados = df[df['Modelo'] != df['Modelo Limpio']].shape[0]
        print(f"Se limpiaron y corrigieron {cambios_realizados} nombres de modelos.")

        # 4. LOAD: Preparar y guardar el archivo de salida
        
        # Paso 4.1: Renombrar y reordenar columnas
        df_salida = df.rename(columns={
            'CODIGO MODELO': 'Código Modelo',
            'Modelo Limpio': 'Modelo'
        })
        
        # Columnas finales según tu solicitud
        df_salida_final = df_salida[columnas_limpias]

        # Paso 4.2: Guardar el nuevo Excel
        try:
            print(f"Guardando archivo limpio en: '{archivo_salida}'")
            df_salida_final.to_excel(archivo_salida, index=False, engine='openpyxl')
            print("Archivo limpio generado correctamente.")
        
        except Exception as e:
            print(f"¡Error! No se pudo guardar el archivo de salida. ¿Está abierto en Excel?")
            print(f"Detalle: {e}")
    else:
        print("¡Error! El archivo no coincide con los formatos soportados.")
        print("Formatos esperados:")
        print(f"  - Crudo: {columnas_crudas}")
        print(f"  - Limpio: {columnas_limpias}")
        sys.exit(1)

    # Paso 5: Crear modelos en la base de datos
    print("\nIniciando proceso de creación de modelos en la base de datos...")
    summary = crear_modelos_bd(df_salida_final)
    imprimir_resumen(summary, archivo_salida)

# ---------------------------- NUEVAS FUNCIONES --------------------------------

def normalizar_texto(valor):
    if pd.isna(valor):
        return ""
    texto = str(valor).strip()
    texto = re.sub(r'\s+', ' ', texto)
    return texto

def normalizar_clave(valor):
    return normalizar_texto(valor).lower()

def crear_modelos_bd(df_salida_final):
    """
    Toma el dataframe limpio y crea los modelos en la base de datos,
    haciendo match por el nombre de la marca (case-insensitive).
    """
    registros = df_salida_final.copy()
    registros['Código Modelo'] = registros['Código Modelo'].apply(normalizar_texto)
    registros['Modelo'] = registros['Modelo'].apply(normalizar_texto)
    registros['Marca'] = registros['Marca'].apply(normalizar_texto)
    if 'Nombre Antiguo' not in registros.columns:
        registros['Nombre Antiguo'] = registros['Modelo']
    registros['Nombre Antiguo'] = registros['Nombre Antiguo'].apply(normalizar_texto)

    # Eliminar filas sin datos esenciales
    registros = registros[
        registros['Código Modelo'].astype(bool) &
        registros['Modelo'].astype(bool) &
        registros['Marca'].astype(bool)
    ]

    # Evitar duplicados por código de modelo
    registros = registros.drop_duplicates(subset=['Código Modelo'])

    app = create_app()
    resultados = []

    with app.app_context():
        marcas_db = (
            db.session.query(Marca)
            .filter(Marca.activo.is_(True))
            .all()
        )
        if not marcas_db:
            print("No se encontraron marcas activas en la base de datos. Abortando creación de modelos.")
            return resultados

        mapa_marcas = {
            normalizar_clave(m.nombre_marca): m for m in marcas_db
        }

        claves_marcas_excel = {
            normalizar_clave(marca) for marca in registros['Marca'].tolist()
        }
        marcas_relevantes = {
            clave: mapa_marcas[clave]
            for clave in claves_marcas_excel
            if clave in mapa_marcas
        }
        marcas_ids = [marca.id_marca for marca in marcas_relevantes.values()]

        codigos_busqueda = [str(c).upper() for c in registros['Código Modelo'].tolist()]
        codigos_existentes = set()
        modelos_por_codigo = {}
        if codigos_busqueda:
            modelos_coincidentes = (
                db.session.query(Modelo)
                .filter(Modelo.codigo_modelo.in_(codigos_busqueda))
                .all()
            )
            for modelo in modelos_coincidentes:
                clave_codigo = (modelo.codigo_modelo or "").upper()
                if clave_codigo:
                    codigos_existentes.add(clave_codigo)
                    modelos_por_codigo[clave_codigo] = modelo

        # Pre-cargar nombres existentes por marca para evitar duplicados
        nombres_existentes = defaultdict(set)
        modelos_por_marca_nombre = defaultdict(dict)
        if marcas_ids:
            modelos_existentes = (
                db.session.query(Modelo)
                .filter(Modelo.id_marca.in_(marcas_ids))
                .all()
            )
            for modelo in modelos_existentes:
                nombre_lower = (modelo.nombre_modelo or "").lower()
                if nombre_lower:
                    nombres_existentes[modelo.id_marca].add(nombre_lower)
                    modelos_por_marca_nombre[modelo.id_marca][nombre_lower] = modelo

        nuevos_modelos = []
        modelos_actualizados = []

        for _, fila in registros.iterrows():
            codigo = fila['Código Modelo'].upper()
            modelo_nombre = fila['Modelo']
            marca_nombre = fila['Marca']
            clave_marca = normalizar_clave(marca_nombre)

            nombre_antiguo = fila.get('Nombre Antiguo', '')

            if len(codigo) > 10:
                resultados.append({
                    'codigo': codigo,
                    'marca': marca_nombre,
                    'modelo': modelo_nombre,
                    'estado': 'error',
                    'detalle': 'El código excede los 10 caracteres permitidos'
                })
                continue

            marca_obj = mapa_marcas.get(clave_marca)
            if not marca_obj:
                resultados.append({
                    'codigo': codigo,
                    'marca': marca_nombre,
                    'modelo': modelo_nombre,
                    'estado': 'error',
                    'detalle': 'Marca no encontrada en la base de datos'
                })
                continue

            if codigo in codigos_existentes:
                modelo_existente = modelos_por_codigo.get(codigo)
                if modelo_existente and modelo_existente.id_marca != marca_obj.id_marca:
                    resultados.append({
                        'codigo': codigo,
                        'marca': marca_nombre,
                        'modelo': modelo_nombre,
                        'estado': 'error',
                        'detalle': 'Código de modelo ya existe y pertenece a otra marca'
                    })
                    continue

                if modelo_existente and nombre_antiguo and not (modelo_existente.nombre_antiguo or "").strip():
                    modelo_existente.nombre_antiguo = nombre_antiguo
                    modelos_actualizados.append(modelo_existente)
                    resultados.append({
                        'codigo': codigo,
                        'marca': marca_nombre,
                        'modelo': modelo_nombre,
                        'estado': 'actualizado',
                        'detalle': 'Modelo existente actualizado con nombre antiguo'
                    })
                else:
                    detalle = 'Código de modelo ya existe en la base de datos'
                    if modelo_existente and nombre_antiguo and (modelo_existente.nombre_antiguo or "").strip() and modelo_existente.nombre_antiguo.strip().lower() != nombre_antiguo.lower():
                        detalle = f"Código existente con nombre antiguo distinto ({modelo_existente.nombre_antiguo})"
                    resultados.append({
                        'codigo': codigo,
                        'marca': marca_nombre,
                        'modelo': modelo_nombre,
                        'estado': 'omitido',
                        'detalle': detalle
                    })
                continue

            nombre_lower = modelo_nombre.lower()
            modelo_existente_por_nombre = modelos_por_marca_nombre[marca_obj.id_marca].get(nombre_lower)
            if modelo_existente_por_nombre:
                if nombre_antiguo and not (modelo_existente_por_nombre.nombre_antiguo or "").strip():
                    modelo_existente_por_nombre.nombre_antiguo = nombre_antiguo
                    modelos_actualizados.append(modelo_existente_por_nombre)
                    resultados.append({
                        'codigo': codigo,
                        'marca': marca_nombre,
                        'modelo': modelo_nombre,
                        'estado': 'actualizado',
                        'detalle': 'Modelo existente actualizado con nombre antiguo'
                    })
                else:
                    detalle = 'El modelo ya existe para esta marca'
                    if nombre_antiguo and (modelo_existente_por_nombre.nombre_antiguo or "").strip() and modelo_existente_por_nombre.nombre_antiguo.strip().lower() != nombre_antiguo.lower():
                        detalle = f"Modelo existente con nombre antiguo distinto ({modelo_existente_por_nombre.nombre_antiguo})"
                    resultados.append({
                        'codigo': codigo,
                        'marca': marca_nombre,
                        'modelo': modelo_nombre,
                        'estado': 'omitido',
                        'detalle': detalle
                    })
                continue
            nuevo_modelo = Modelo(
                codigo_modelo=codigo,
                nombre_modelo=modelo_nombre,
                nombre_antiguo=nombre_antiguo or None,
                id_marca=marca_obj.id_marca
            )
            nuevos_modelos.append(nuevo_modelo)
            codigos_existentes.add(codigo)
            nombres_existentes[marca_obj.id_marca].add(nombre_lower)
            modelos_por_marca_nombre[marca_obj.id_marca][nombre_lower] = nuevo_modelo
            resultados.append({
                'codigo': codigo,
                'marca': marca_nombre,
                'modelo': modelo_nombre,
                'estado': 'creado',
                'detalle': 'Modelo creado exitosamente'
            })

        if nuevos_modelos or modelos_actualizados:
            db.session.add_all(nuevos_modelos)
            db.session.commit()
            if nuevos_modelos:
                print(f"Se crearon {len(nuevos_modelos)} modelos nuevos.")
            if modelos_actualizados:
                print(f"Se actualizaron {len(modelos_actualizados)} modelos existentes con nombre antiguo.")
        else:
            print("No se crearon nuevos modelos ni se realizaron actualizaciones.")

    return resultados

def imprimir_resumen(resultados, archivo_salida):
    if not resultados:
        print("No hay resultados para mostrar.")
        return

    totales = defaultdict(int)
    for res in resultados:
        totales[res['estado']] += 1

    print("\nResumen de la carga en base de datos:")
    for estado, cantidad in totales.items():
        print(f"  - {estado.capitalize()}: {cantidad}")

    errores = [r for r in resultados if r['estado'] == 'error']
    omitidos = [r for r in resultados if r['estado'] == 'omitido']
    actualizados = [r for r in resultados if r['estado'] == 'actualizado']

    def imprimir_detalles(nombre, lista):
        if not lista:
            return
        print(f"\nDetalle de {nombre}:")
        for item in lista:
            print(f"  • Código: {item['codigo']} | Marca: {item['marca']} | Modelo: {item['modelo']} | Motivo: {item['detalle']}")

    imprimir_detalles("errores", errores)
    imprimir_detalles("actualizados", actualizados)
    imprimir_detalles("omitidos", omitidos)

    # Guardar log en un archivo aparte
    log_path = os.path.splitext(archivo_salida)[0] + "_LOG_CARGA.xlsx"
    df_log = pd.DataFrame(resultados)
    df_log = df_log[['codigo', 'marca', 'modelo', 'estado', 'detalle']]
    df_log.rename(columns={
        'codigo': 'Código Modelo',
        'marca': 'Marca',
        'modelo': 'Modelo',
        'estado': 'Estado',
        'detalle': 'Detalle'
    }, inplace=True)

    try:
        df_log.to_excel(log_path, index=False, engine='openpyxl')
        print(f"Log de carga guardado en: '{log_path}'")
    except Exception as e:
        print(f"No se pudo guardar el log de carga. Detalle: {e}")

# --- Ejecución del script ---
if __name__ == "__main__":
    # Dependencias: pip install pandas openpyxl
    procesar_modelos()