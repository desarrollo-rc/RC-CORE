# archivos_routes.py

import os
from flask import Blueprint, jsonify, send_file, request
from flask_jwt_extended import jwt_required
from typing import List, Dict
from datetime import datetime

archivos_bp = Blueprint('archivos', __name__, url_prefix='/archivos')

# Ruta base para archivos extraídos
BASE_PATH = '/home/cecheverria/work/projects/RepuestoCenter/backend/archivos_extraidos/gmail_pdfs'


@archivos_bp.route('/gmail/pdfs', methods=['GET'])
@jwt_required()
def listar_pdfs_gmail():
    """
    Lista todos los PDFs extraídos de Gmail organizados por fecha.
    """
    try:
        pdfs = []
        
        if not os.path.exists(BASE_PATH):
            return jsonify({
                'exito': True,
                'mensaje': 'No hay archivos PDF extraídos',
                'pdfs': []
            })
        
        # Recorrer estructura de carpetas por año/mes
        for año in os.listdir(BASE_PATH):
            año_path = os.path.join(BASE_PATH, año)
            if not os.path.isdir(año_path):
                continue
                
            for mes in os.listdir(año_path):
                mes_path = os.path.join(año_path, mes)
                if not os.path.isdir(mes_path):
                    continue
                
                # Procesar archivos PDF del mes
                for archivo in os.listdir(mes_path):
                    if archivo.endswith('.pdf'):
                        archivo_path = os.path.join(mes_path, archivo)
                        stat = os.stat(archivo_path)
                        
                        # Extraer información del nombre del archivo
                        # Formato: B2B00006752_2025-10-06_04-17.pdf
                        nombre_sin_ext = archivo.replace('.pdf', '')
                        partes = nombre_sin_ext.split('_')
                        
                        codigo_b2b = partes[0] if len(partes) > 0 else 'N/A'
                        fecha_str = partes[1] if len(partes) > 1 else 'N/A'
                        hora_str = partes[2] if len(partes) > 2 else 'N/A'
                        
                        pdfs.append({
                            'nombre_archivo': archivo,
                            'codigo_b2b': codigo_b2b,
                            'fecha_extraccion': f"{fecha_str}_{hora_str}",
                            'tamaño_bytes': stat.st_size,
                            'tamaño_mb': round(stat.st_size / (1024 * 1024), 2),
                            'fecha_modificacion': datetime.fromtimestamp(stat.st_mtime).isoformat(),
                            'ruta_relativa': os.path.join(año, mes, archivo)
                        })
        
        # Ordenar por fecha de modificación (más recientes primero)
        pdfs.sort(key=lambda x: x['fecha_modificacion'], reverse=True)
        
        return jsonify({
            'exito': True,
            'mensaje': f'Se encontraron {len(pdfs)} archivos PDF',
            'pdfs': pdfs
        })
        
    except Exception as e:
        return jsonify({
            'exito': False,
            'mensaje': f'Error al listar PDFs: {str(e)}'
        }), 500


@archivos_bp.route('/gmail/pdfs/descargar/<path:ruta_relativa>', methods=['GET'])
@jwt_required()
def descargar_pdf_gmail(ruta_relativa):
    """
    Descarga un PDF específico extraído de Gmail.
    """
    try:
        # Construir ruta completa
        ruta_completa = os.path.join(BASE_PATH, ruta_relativa)
        
        # Validar que el archivo existe y está dentro del directorio permitido
        if not os.path.exists(ruta_completa):
            return jsonify({
                'exito': False,
                'mensaje': 'Archivo no encontrado'
            }), 404
        
        # Validar que la ruta está dentro del directorio permitido (seguridad)
        ruta_real = os.path.realpath(ruta_completa)
        base_real = os.path.realpath(BASE_PATH)
        if not ruta_real.startswith(base_real):
            return jsonify({
                'exito': False,
                'mensaje': 'Acceso denegado'
            }), 403
        
        # Validar que es un archivo PDF
        if not ruta_completa.endswith('.pdf'):
            return jsonify({
                'exito': False,
                'mensaje': 'Tipo de archivo no permitido'
            }), 400
        
        # Obtener nombre del archivo para la descarga
        nombre_archivo = os.path.basename(ruta_completa)
        
        return send_file(
            ruta_completa,
            as_attachment=True,
            download_name=nombre_archivo,
            mimetype='application/pdf'
        )
        
    except Exception as e:
        return jsonify({
            'exito': False,
            'mensaje': f'Error al descargar archivo: {str(e)}'
        }), 500


@archivos_bp.route('/gmail/pdfs/eliminar/<path:ruta_relativa>', methods=['DELETE'])
@jwt_required()
def eliminar_pdf_gmail(ruta_relativa):
    """
    Elimina un PDF específico extraído de Gmail.
    """
    try:
        # Construir ruta completa
        ruta_completa = os.path.join(BASE_PATH, ruta_relativa)
        
        # Validar que el archivo existe y está dentro del directorio permitido
        if not os.path.exists(ruta_completa):
            return jsonify({
                'exito': False,
                'mensaje': 'Archivo no encontrado'
            }), 404
        
        # Validar que la ruta está dentro del directorio permitido (seguridad)
        ruta_real = os.path.realpath(ruta_completa)
        base_real = os.path.realpath(BASE_PATH)
        if not ruta_real.startswith(base_real):
            return jsonify({
                'exito': False,
                'mensaje': 'Acceso denegado'
            }), 403
        
        # Eliminar archivo
        os.remove(ruta_completa)
        
        return jsonify({
            'exito': True,
            'mensaje': 'Archivo eliminado correctamente'
        })
        
    except Exception as e:
        return jsonify({
            'exito': False,
            'mensaje': f'Error al eliminar archivo: {str(e)}'
        }), 500
