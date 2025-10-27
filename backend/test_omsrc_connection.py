#!/usr/bin/env python3
"""
Script de prueba para verificar la conexión a OMSRC.
Ejecutar desde el directorio backend: python test_omsrc_connection.py
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from app.api.v1.services.consulta_service import ConsultaService

def test_connection():
    """Test the OMSRC connection"""
    app = create_app()
    
    with app.app_context():
        print("🔍 Probando conexión a OMSRC...")
        print("=" * 50)
        
        try:
            connection_ok, connection_msg = ConsultaService.test_omsrc_connection()
            
            if connection_ok:
                print("✅ CONEXIÓN EXITOSA")
                print(f"📋 Detalles: {connection_msg}")
                print("\n🎉 La sincronización B2B debería funcionar correctamente.")
            else:
                print("❌ ERROR DE CONEXIÓN")
                print(f"📋 Detalles: {connection_msg}")
                print("\n🔧 Posibles soluciones:")
                print("1. Verificar que el servidor SQL Server esté accesible")
                print("2. Verificar la configuración de red y firewall")
                print("3. Verificar que las credenciales sean correctas")
                print("4. Verificar que el puerto 1433 esté abierto")
                print("5. Contactar al administrador de la base de datos")
                
        except Exception as e:
            print("❌ ERROR INESPERADO")
            print(f"📋 Detalles: {str(e)}")
            print(f"📋 Tipo: {type(e).__name__}")
            
        print("=" * 50)

if __name__ == "__main__":
    test_connection()
