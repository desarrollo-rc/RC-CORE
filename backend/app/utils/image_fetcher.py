# backend/app/utils/image_fetcher.py
from app.extensions import db
from sqlalchemy.sql import text

def get_images_for_sku(sku: str) -> list[str]:
    """
    Obtiene las URLs de imágenes para un SKU específico desde la BD 'omsrc',
    usando el bind de SQLAlchemy 'omsrc' (SQL Server).
    """
    if not sku:
        return []

    # Debugging específico para SKUs del primer batch
    sku_int = None
    try:
        print(f"🔍 Image fetcher: Processing SKU {sku} (type: {type(sku)})")
        if isinstance(sku, (int, str)) and str(sku).isdigit():
            sku_int = int(sku)
            print(f"🔍 Image fetcher: SKU {sku} converted to int: {sku_int}")
            if sku_int is not None and sku_int < 2000:
                print(f"🔍 Image fetcher: FIRST BATCH SKU {sku} (int: {sku_int}) - Starting query...")
    except Exception as e:
        print(f"🔍 Image fetcher: Error processing SKU {sku}: {e}")
        pass

    # La consulta SQL exacta de tu script (fotos_china_BD_CHILE_v3.py)
    # Usamos :sku para pasar parámetros de forma segura
    # IMPORTANTE: Convertimos ambos lados a VARCHAR para evitar errores de conversión
    sql_query = text("""
        SELECT 
            CASE 
            WHEN B.urlImagen LIKE '../Content/%' 
            THEN 'https://oms.repuestoscenter.cl/' + SUBSTRING(B.urlImagen, 4, LEN(B.urlImagen))
            ELSE B.urlImagen
            END AS urlImagen
        FROM [productos].[imagenesProducto] B
        WHERE B.idProducto = (
            SELECT TOP 1 idProducto 
            FROM [productos].[baseMaestroProductosBuscador]
            WHERE CAST(codigoTecnico AS VARCHAR(50)) = CAST(:sku AS VARCHAR(50))
        )
    """)
    
    urls = []
    
    try:
        # Debugging específico para el primer batch
        if sku_int is not None and sku_int < 2000:
            print(f"🔍 Image fetcher: FIRST BATCH SKU {sku} - Executing SQL query...")
        
        print(f"🔍 Image fetcher: About to execute SQL for SKU {sku} (type: {type(sku)})")
        print(f"🔍 Image fetcher: SQL query: {sql_query}")
        print(f"🔍 Image fetcher: Parameters: {{'sku': {sku}}}")
        
        # Usamos el motor de BIND 'omsrc' definido en config.py (SQL Server)
        # IMPORTANTE: Cada thread debe obtener su propia conexión del pool
        # pyodbc con SQL Server puede tener problemas con conexiones concurrentes
        # Usar un retry mechanism para manejar errores de "Connection is busy"
        import time
        max_retries = 3
        retry_delay = 0.1  # 100ms entre reintentos
        
        engine = db.get_engine(bind_key='omsrc')
        urls = []  # Inicializar urls antes del loop de retry
        
        for attempt in range(max_retries):
            try:
                # Usar raw_connection() para obtener una conexión directa del pool
                # y asegurarnos de que se cierre correctamente
                connection = engine.raw_connection()
                try:
                    cursor = connection.cursor()
                    # Ejecutar la query directamente con pyodbc para mejor control
                    cursor.execute("""
                        SELECT 
                            CASE 
                            WHEN B.urlImagen LIKE '../Content/%' 
                            THEN 'https://oms.repuestoscenter.cl/' + SUBSTRING(B.urlImagen, 4, LEN(B.urlImagen))
                            ELSE B.urlImagen
                            END AS urlImagen
                        FROM [productos].[imagenesProducto] B
                        WHERE B.idProducto = (
                            SELECT TOP 1 idProducto 
                            FROM [productos].[baseMaestroProductosBuscador]
                            WHERE CAST(codigoTecnico AS VARCHAR(50)) = CAST(? AS VARCHAR(50))
                        )
                    """, sku)
                    
                    # Obtener todos los resultados inmediatamente
                    rows = cursor.fetchall()
                    # Convertir a lista de strings
                    urls = [row[0] for row in rows if row[0]]
                    
                    cursor.close()
                    connection.close()
                    
                    print(f"🔍 Image fetcher: Retrieved {len(urls)} URLs for SKU {sku}")
                    if sku_int is not None and sku_int < 2000:
                        print(f"🔍 Image fetcher: FIRST BATCH SKU {sku} - Found {len(urls)} URLs: {urls[:3] if urls else 'None'}")
                    
                    # Si llegamos aquí, la query fue exitosa, salir del loop de retry
                    break
                    
                except Exception as e:
                    cursor.close()
                    connection.close()
                    raise e
                    
            except Exception as e:
                error_str = str(e)
                if "Connection is busy" in error_str and attempt < max_retries - 1:
                    wait_time = retry_delay * (attempt + 1)
                    print(f"⚠️ Image fetcher: Connection busy for SKU {sku}, retry {attempt + 1}/{max_retries} after {wait_time}s")
                    time.sleep(wait_time)
                    continue
                else:
                    # Si no es un error de conexión ocupada o es el último intento, re-lanzar
                    raise
            
    except Exception as e:
        print(f"❌ Image fetcher: Error for SKU {sku}: {str(e)}")
        print(f"❌ Image fetcher: Error type: {type(e).__name__}")
        print(f"❌ Image fetcher: Error details: {str(e)}")
        if sku_int is not None and sku_int < 2000:
            print(f"🔍 Image fetcher: FIRST BATCH SKU {sku} - ERROR DETAILS: {type(e).__name__}: {str(e)}")
        import traceback
        print(f"❌ Image fetcher: Traceback: {traceback.format_exc()}")
        urls = []
    
    # Asegurar que siempre devolvemos una lista
    if not isinstance(urls, list):
        print(f"⚠️ Image fetcher: SKU {sku} - urls is not a list, converting to empty list")
        urls = []
    
    if sku_int is not None and sku_int < 2000:
        print(f"🔍 Image fetcher: FIRST BATCH SKU {sku} - Final result: {len(urls)} URLs")
    else:
        print(f"🔍 Image fetcher: SKU {sku} - returning {len(urls)} URLs")
    
    return urls