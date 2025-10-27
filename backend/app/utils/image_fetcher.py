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
        with db.get_engine(bind_key='omsrc').connect() as conn:
            print(f"🔍 Image fetcher: Database connection established for SKU {sku}")
            result = conn.execute(sql_query, {'sku': sku})
            print(f"🔍 Image fetcher: SQL executed successfully for SKU {sku}")
            rows = result.fetchall()
            print(f"🔍 Image fetcher: Retrieved {len(rows)} rows for SKU {sku}")
            
            # Convertir lista de tuplas [('url1',), ('url2',)] a lista de strings ['url1', 'url2']
            urls = [row[0] for row in rows if row[0]]
            print(f"🔍 Image fetcher: Processed {len(urls)} valid URLs for SKU {sku}")
            
            if sku_int is not None and sku_int < 2000:
                print(f"🔍 Image fetcher: FIRST BATCH SKU {sku} - Found {len(urls)} URLs: {urls[:3] if urls else 'None'}")
            
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