# backend/app/api/v1/routes/compras_routes.py
from flask import Blueprint, jsonify, request, current_app, send_file
from flask_jwt_extended import jwt_required
from app.utils.image_fetcher import get_images_for_sku
import concurrent.futures
import requests
from io import BytesIO
from functools import lru_cache

compras_bp = Blueprint('compras', __name__, url_prefix='/compras')

# Cache simple para almacenar URLs de imágenes por SKU
# Formato: {sku: [url1, url2, ...]}
_image_cache = {}

# Cache más agresivo con TTL
from functools import lru_cache
import time

# Cache con timestamp para TTL
_image_cache = {}
_cache_ttl = 300  # 5 minutos

def _cached_get_images(sku: str):
    """Cache las imágenes para un SKU con TTL"""
    current_time = time.time()
    
    # Verificar si existe en cache y no ha expirado
    if sku in _image_cache:
        cached_data, timestamp = _image_cache[sku]
        if current_time - timestamp < _cache_ttl:
            return cached_data
    
    # Si no está en cache o expiró, obtener de BD
    images = get_images_for_sku(sku)
    _image_cache[sku] = (tuple(images), current_time)
    
    return tuple(images)

def _fetch_sku_images_worker(app, sku):
    """
    Worker function para el ThreadPool.
    Crea su propio contexto de aplicación para poder usar 'db'.
    """
    with app.app_context():
        # Ahora que estamos en un contexto, podemos llamar a la función
        # que usa 'db' de forma segura.
        return get_images_for_sku(sku)

@compras_bp.route('/cotizador/fetch-images', methods=['POST'])
@jwt_required()
def fetch_images_for_skus():
    """
    Recibe una lista de SKUs y devuelve un mapa con las URLs de imágenes
    para cada SKU, consultando la BD 'rcenter' en paralelo.
    Las URLs retornadas apuntan a endpoints del backend que sirven las imágenes.
    """
    import time
    start_time = time.time()
    
    data = request.get_json()
    if not data or 'skus' not in data:
        return jsonify({'exito': False, 'mensaje': 'No se proporcionó la lista de SKUs'}), 400

    skus = data['skus']
    unique_skus = list(set(skus))

    app = current_app._get_current_object()
    
    print(f"🚀 Backend: Starting image fetch for {len(unique_skus)} unique SKUs...")
    
    image_map = {}

    try:
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            future_to_sku = {executor.submit(_fetch_sku_images_worker, app, sku): sku for sku in unique_skus}
            
            for future in concurrent.futures.as_completed(future_to_sku):
                sku = future_to_sku[future]
                try:
                    # Obtenemos el resultado (la lista de URLs externas)
                    external_urls = future.result()
                    
                    # Convertir a URLs ABSOLUTAS que apunten a nuestro backend
                    # Esto es importante para que Excel pueda descargar las imágenes
                    backend_base_url = 'http://127.0.0.1:5000/api/v1'  # En producción cambiar a URL real
                    backend_urls = [f"{backend_base_url}/compras/image/{sku}/{i}" for i in range(min(5, len(external_urls)))]
                    image_map[sku] = backend_urls
                        
                except Exception as e:
                    image_map[sku] = []
    
        end_time = time.time()
        total_time = (end_time - start_time) * 1000
        skus_per_second = len(unique_skus) / (end_time - start_time)
        
        print(f"✅ Backend: Image URLs fetched successfully!")
        print(f"⏱️  Backend: Total time: {total_time:.2f}ms")
        print(f"📊 Backend: Performance: {skus_per_second:.1f} SKUs/second")
        print(f"📈 Backend: Found images for {len([k for k, v in image_map.items() if v])} SKUs")
        
        return jsonify({'exito': True, 'image_map': image_map}), 200

    except Exception as e:
        end_time = time.time()
        print(f"❌ Backend: Error after {(end_time - start_time) * 1000:.2f}ms: {str(e)}")
        return jsonify({'exito': False, 'mensaje': f'Error procesando SKUs: {str(e)}'}), 500

@compras_bp.route('/test-image-server', methods=['GET'])
def test_image_server():
    """
    Endpoint de diagnóstico para probar la conectividad al servidor de imágenes externo.
    Ayuda a identificar problemas de red, firewall o autenticación.
    """
    import socket
    
    test_url = "https://imagenes.repuestoscenter.cl/Content/Imagenes/Productos/1000/5307/5307_01.jpg"
    
    results = {
        'dns_resolution': None,
        'http_request': None,
        'errors': []
    }
    
    # Test 1: Resolución DNS
    try:
        ip = socket.gethostbyname('imagenes.repuestoscenter.cl')
        results['dns_resolution'] = {
            'status': 'OK',
            'ip': ip,
            'message': f'Dominio resuelto a {ip}'
        }
    except socket.gaierror as e:
        results['dns_resolution'] = {
            'status': 'ERROR',
            'message': f'No se pudo resolver el dominio: {str(e)}'
        }
        results['errors'].append('DNS resolution failed')
    
    # Test 2: Solicitud HTTP
    try:
        response = requests.get(test_url, timeout=5)
        results['http_request'] = {
            'status': 'OK' if response.status_code == 200 else f'HTTP {response.status_code}',
            'status_code': response.status_code,
            'content_length': len(response.content),
            'message': f'Solicitud exitosa - Status {response.status_code}'
        }
    except requests.exceptions.ConnectionError as e:
        results['http_request'] = {
            'status': 'ERROR',
            'error_type': 'Connection Error',
            'message': f'No se pudo conectar: {str(e)}'
        }
        results['errors'].append('Connection refused')
    except requests.exceptions.Timeout as e:
        results['http_request'] = {
            'status': 'ERROR',
            'error_type': 'Timeout',
            'message': f'La solicitud tardó demasiado: {str(e)}'
        }
        results['errors'].append('Timeout')
    except Exception as e:
        results['http_request'] = {
            'status': 'ERROR',
            'error_type': type(e).__name__,
            'message': str(e)
        }
        results['errors'].append(f'Other error: {type(e).__name__}')
    
    # Resumen
    all_ok = results['dns_resolution']['status'] == 'OK' and results['http_request'].get('status') == 'OK'
    
    return jsonify({
        'test_url': test_url,
        'all_ok': all_ok,
        'results': results,
        'recommendations': [
            'Verifica que tu ISP/red no bloquee el acceso al dominio',
            'Intenta acceder manualmente a imagenes.repuestoscenter.cl en el navegador',
            'Si es error de DNS: Intenta cambiar a DNS público (8.8.8.8)',
            'Si es error de conexión: Puede estar bloqueado por firewall corporativo',
            'Si tienes VPN, intenta conectarte/desconectarte',
            'Contacta al proveedor del servidor de imágenes para verificar que tu IP tenga acceso'
        ]
    }), 200


@compras_bp.route('/image/<sku>/<int:index>', methods=['GET'])
def serve_product_image(sku: str, index: int):
    """
    Sirve una imagen de un producto específico.
    Actúa como proxy para obtener imágenes desde el servidor externo.
    Si no puede acceder al servidor externo, retorna un placeholder.
    """
    
    try:
        # Usar cache para evitar consultar BD múltiples veces
        images = list(_cached_get_images(sku))
        
        if not images or index >= len(images) or index < 0:
            return jsonify({'error': 'Imagen no encontrada'}), 404
        
        image_url = images[index]
        
        try:
            # Sistema de retry con timeouts progresivos
            timeouts = [1.5, 3.0, 5.0]  # 1.5s, 3s, 5s
            last_error = None
            
            for attempt, timeout in enumerate(timeouts):
                try:
                    # Hacer una solicitud HTTP al servidor de imágenes
                    response = requests.get(image_url, timeout=timeout, allow_redirects=True)
                    response.raise_for_status()
                    
                    # Verificar que la imagen no esté vacía
                    if len(response.content) < 100:  # Menos de 100 bytes probablemente es error
                        raise Exception("Image too small, likely an error page")
                    
                    # Retornar la imagen con el tipo de contenido correcto
                    return send_file(
                        BytesIO(response.content),
                        mimetype=response.headers.get('Content-Type', 'image/jpeg'),
                        as_attachment=False
                    )
                    
                except Exception as e:
                    last_error = e
                    if attempt < len(timeouts) - 1:  # No es el último intento
                        import time
                        time.sleep(0.2 * (attempt + 1))  # Esperar un poco antes del retry
                        continue
                    else:
                        raise e
        except (requests.exceptions.Timeout, requests.exceptions.ConnectionError, requests.exceptions.ConnectTimeout) as e:
            # Si no puede conectarse al servidor externo, retornar placeholder
            placeholder = BytesIO(b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\xcd\xf4\x0b\xaf\x00\x00\x00\x00IEND\xaeB`\x82')
            return send_file(placeholder, mimetype='image/png', as_attachment=False)
        except requests.exceptions.RequestException as e:
            # Retornar placeholder en caso de error
            placeholder = BytesIO(b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\xcd\xf4\x0b\xaf\x00\x00\x00\x00IEND\xaeB`\x82')
            return send_file(placeholder, mimetype='image/png', as_attachment=False)
        
    except Exception as e:
        # Retornar placeholder en caso de error crítico
        placeholder = BytesIO(b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\xcd\xf4\x0b\xaf\x00\x00\x00\x00IEND\xaeB`\x82')
        return send_file(placeholder, mimetype='image/png', as_attachment=False)