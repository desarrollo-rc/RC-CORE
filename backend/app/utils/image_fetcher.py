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

    # La consulta SQL exacta de tu script (fotos_china_BD_CHILE_v3.py)
    # Usamos :sku para pasar parámetros de forma segura
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
            WHERE codigoTecnico = :sku
        )
    """)
    
    urls = []
    
    try:
        # Usamos el motor de BIND 'omsrc' definido en config.py (SQL Server)
        with db.get_engine(bind_key='omsrc').connect() as conn:
            result = conn.execute(sql_query, {'sku': sku})
            rows = result.fetchall()
            
            # Convertir lista de tuplas [('url1',), ('url2',)] a lista de strings ['url1', 'url2']
            urls = [row[0] for row in rows if row[0]]
            
    except Exception as e:
        pass
    
    return urls