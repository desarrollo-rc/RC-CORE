# backend/app/api/v1/routes/compras_routes.py
from flask import Blueprint, jsonify, request, current_app, send_file
from flask_jwt_extended import jwt_required
from app.utils.image_fetcher import get_images_for_sku
import concurrent.futures
import requests
from io import BytesIO
from functools import lru_cache

compras_bp = Blueprint('compras', __name__, url_prefix='/compras')

# Cache con TTL simple para URLs de imágenes por SKU
import time
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
        try:
            print(f"🔍 Worker: Processing SKU {sku} (type: {type(sku)})")
            result = get_images_for_sku(sku)
            print(f"🔍 Worker: SKU {sku} - returning {len(result)} URLs")
            return result
        except Exception as e:
            print(f"❌ Worker: Error processing SKU {sku}: {e}")
            return []

@compras_bp.route('/cotizador/fetch-images', methods=['POST'])
#@jwt_required()
def fetch_images_for_skus():
    """
    Recibe una lista de SKUs y devuelve un mapa con las URLs de imágenes
    para cada SKU, consultando la BD 'rcenter' en paralelo.
    Las URLs retornadas apuntan a endpoints del backend que sirven las imágenes.
    """
    import time
    start_time = time.time()
    
    try:
        request_id = f"req_{int(start_time * 1000)}"
        print(f"🔍 Backend: Received request {request_id} at {start_time}")
        data = request.get_json()
        print(f"🔍 Backend: Request {request_id} data received: {data is not None}")
        
        if not data or 'skus' not in data:
            print(f"❌ Backend: Request {request_id} - Invalid request data")
            return jsonify({'exito': False, 'mensaje': 'No se proporcionó la lista de SKUs'}), 400

        skus = data['skus']
        print(f"🔍 Backend: Request {request_id} - SKUs extracted: {len(skus) if skus else 0}")
        unique_skus = list(set(skus))
        print(f"🔍 Backend: Request {request_id} - Unique SKUs: {len(unique_skus)}")

        app = current_app._get_current_object()
        print(f"🔍 Backend: Request {request_id} - App context obtained")
    
    except Exception as e:
        print(f"❌ Backend: Error in request processing: {e}")
        print(f"❌ Backend: Error type: {type(e)}")
        import traceback
        print(f"❌ Backend: Traceback: {traceback.format_exc()}")
        return jsonify({'exito': False, 'mensaje': f'Error procesando request: {e}'}), 500
    
    print(f"🚀 Backend: Starting image fetch for {len(unique_skus)} unique SKUs...")
    print(f"🔍 Backend: First 5 SKUs received: {skus[:5]}")
    print(f"🔍 Backend: SKU types: {[type(sku) for sku in skus[:5]]}")
    print(f"🔍 Backend: SKU values: {skus[:5]}")
    
    # Debugging adicional para entender el problema
    for i, sku in enumerate(skus[:5]):
        print(f"🔍 Backend: SKU {i}: {sku} (type: {type(sku)})")
        try:
            if isinstance(sku, (int, str)):
                print(f"   - isdigit(): {str(sku).isdigit()}")
                if str(sku).isdigit():
                    sku_int = int(sku)
                    print(f"   - int value: {sku_int}")
                    print(f"   - comparison test: {sku_int < 2000}")
        except Exception as e:
            print(f"   - ERROR: {e}")
    
    # Debugging simplificado
    print(f"🔍 Backend: Processing {len(unique_skus)} SKUs")
    
    image_map = {}

    try:
        print(f"🔍 Backend: About to start ThreadPoolExecutor with {len(unique_skus)} SKUs")
        
        # Reducir el número de workers para evitar conflictos de conexión a la BD
        # SQL Server con pyodbc puede tener problemas con múltiples conexiones simultáneas
        # Reducir aún más para evitar el error "Connection is busy"
        max_workers = min(3, len(unique_skus))  # Máximo 3 workers o el número de SKUs si es menor
        print(f"🔍 Backend: Using {max_workers} workers for parallel processing (reduced to avoid connection conflicts)")
        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            print(f"🔍 Backend: ThreadPoolExecutor created successfully")
            
            # Crear tareas para cada SKU con debugging
            print(f"🔍 Backend: Creating tasks for {len(unique_skus)} SKUs")
            future_to_sku = {}
            
            for i, sku in enumerate(unique_skus):
                try:
                    print(f"🔍 Backend: Submitting task {i+1}/{len(unique_skus)} for SKU {sku} (type: {type(sku)})")
                    future = executor.submit(_fetch_sku_images_worker, app, sku)
                    future_to_sku[future] = sku
                    print(f"🔍 Backend: Task submitted successfully for SKU {sku}")
                except Exception as e:
                    print(f"❌ Backend: Error submitting task for SKU {sku}: {e}")
                    print(f"❌ Backend: Error type: {type(e)}")
                    import traceback
                    print(f"❌ Backend: Traceback: {traceback.format_exc()}")
                    # Continuar con el siguiente SKU
                    continue
            
            print(f"🔍 Backend: All tasks submitted. Processing {len(future_to_sku)} futures...")
            
            for future in concurrent.futures.as_completed(future_to_sku):
                # Obtener el SKU asociado a este future ANTES de obtener el resultado
                sku = future_to_sku[future]
                print(f"🔍 Backend: Processing result for SKU: {sku} (future completed)")
                
                try:
                    # Obtenemos el resultado (la lista de URLs externas)
                    external_urls = future.result()
                    
                    # Debugging: verificar el tipo de external_urls
                    print(f"🔍 Backend: SKU {sku} - external_urls type: {type(external_urls)}, length: {len(external_urls) if isinstance(external_urls, list) else 'N/A'}")
                    
                    # Asegurar que external_urls es una lista
                    if not isinstance(external_urls, list):
                        print(f"⚠️ Backend: SKU {sku} - external_urls is not a list, converting...")
                        external_urls = []
                    
                    # Verificar que no haya un SKU previo con las mismas URLs (posible mezcla de resultados)
                    if sku in image_map:
                        print(f"⚠️ Backend: WARNING - SKU {sku} already exists in image_map! Overwriting...")
                    
                    # Convertir a URLs ABSOLUTAS que apunten a nuestro backend
                    # Esto es importante para que Excel pueda descargar las imágenes
                    backend_base_url = 'http://127.0.0.1:5000/api/v1'  # En producción cambiar a URL real
                    backend_urls = [f"{backend_base_url}/compras/image/{sku}/{i}" for i in range(min(5, len(external_urls)))]
                    image_map[sku] = backend_urls
                    print(f"✅ Backend: Mapped {len(backend_urls)} URLs to SKU: {sku}")
                        
                except Exception as e:
                    print(f"❌ Backend: Error processing SKU {sku}: {str(e)}")
                    image_map[sku] = []
    
        end_time = time.time()
        total_time = (end_time - start_time) * 1000
        skus_per_second = len(unique_skus) / (end_time - start_time)
        
        print(f"✅ Backend: Image URLs fetched successfully!")
        print(f"⏱️  Backend: Total time: {total_time:.2f}ms")
        print(f"📊 Backend: Performance: {skus_per_second:.1f} SKUs/second")
        print(f"📈 Backend: Found images for {len([k for k, v in image_map.items() if v])} SKUs")
        
        # Convertir a tipos serializables
        serializable_map = {}
        for sku, urls in image_map.items():
            serializable_map[str(sku)] = [str(url) for url in urls]
        
        return jsonify({'exito': True, 'image_map': serializable_map}), 200

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
            # Aumentar timeouts para dar más tiempo al servidor externo
            timeouts = [3.0, 5.0, 8.0]  # 3s, 5s, 8s
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

@compras_bp.route('/cotizador/fetch-images-debug', methods=['POST'])
def fetch_images_for_skus_debug():
    """
    Endpoint de DEBUG sin autenticación para probar el procesamiento de SKUs.
    """
    import time
    start_time = time.time()
    
    try:
        request_id = f"debug_req_{int(start_time * 1000)}"
        print(f"🔍 DEBUG: Received request {request_id} at {start_time}")
        data = request.get_json()
        print(f"🔍 DEBUG: Request {request_id} data received: {data is not None}")
        
        if not data or 'skus' not in data:
            print(f"❌ DEBUG: Request {request_id} - Invalid request data")
            return jsonify({'exito': False, 'mensaje': 'No se proporcionó la lista de SKUs'}), 400

        skus = data['skus']
        print(f"🔍 DEBUG: Request {request_id} - SKUs extracted: {len(skus) if skus else 0}")
        unique_skus = list(set(skus))
        print(f"🔍 DEBUG: Request {request_id} - Unique SKUs: {len(unique_skus)}")

        app = current_app._get_current_object()
        print(f"🔍 DEBUG: Request {request_id} - App context obtained")
        
        # Procesar solo los primeros 5 SKUs para debug
        test_skus = unique_skus[:5]
        print(f"🔍 DEBUG: Testing with first 5 SKUs: {test_skus}")
        
        image_map = {}
        for sku in test_skus:
            try:
                images = get_images_for_sku(sku)
                image_map[sku] = images
                print(f"🔍 DEBUG: SKU {sku} - {len(images)} images")
            except Exception as e:
                print(f"❌ DEBUG: Error with SKU {sku}: {e}")
                image_map[sku] = []
        
        print(f"🔍 DEBUG: Request {request_id} - Completed successfully")
        
        # Convertir a tipos serializables
        serializable_map = {}
        for sku, urls in image_map.items():
            serializable_map[str(sku)] = [str(url) for url in urls]
        
        return jsonify({
            'exito': True,
            'imagenes': serializable_map,
            'total_skus': len(test_skus),
            'skus_con_imagenes': len([k for k, v in image_map.items() if v])
        }), 200
        
    except Exception as e:
        print(f"❌ DEBUG: Error in request processing: {e}")
        print(f"❌ DEBUG: Error type: {type(e)}")
        import traceback
        print(f"❌ DEBUG: Traceback: {traceback.format_exc()}")
        return jsonify({'exito': False, 'mensaje': f'Error procesando request: {e}'}), 500