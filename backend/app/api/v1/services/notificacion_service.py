# backend/app/api/v1/services/notificacion_service.py
import requests
import json
from flask import current_app

class NotificacionService:
    def enviar_whatsapp(self, to_number, message_body):
        """
        Envía un mensaje de WhatsApp leyendo la configuración desde la app actual.
        """
        # Lee la configuración JUSTO AHORA, desde la aplicación activa.
        access_token = current_app.config.get('META_ACCESS_TOKEN')
        phone_number_id = current_app.config.get('META_PHONE_NUMBER_ID')
        
        if not all([access_token, phone_number_id]):
            raise ValueError("Credenciales de Meta WhatsApp no están configuradas en la aplicación. Revisa tu config.py.")

        api_version = 'v18.0'
        api_url = f"https://graph.facebook.com/{api_version}/{phone_number_id}/messages"
        
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }
        payload = {
            "messaging_product": "whatsapp",
            "to": to_number,
            "type": "template",
            "template": {
                "name": "notificacion_sistema_rc_core", # El nombre de nuestra plantilla
                "language": {
                    "code": "es" # El idioma que seleccionamos
                },
                "components": [
                    {
                        "type": "body",
                        "parameters": [
                            {
                                "type": "text",
                                "text": message_body # Aquí va el mensaje personalizado del frontend
                            }
                        ]
                    }
                ]
            }
        }
        
        try:
            response = requests.post(api_url, headers=headers, data=json.dumps(payload))
            response.raise_for_status()
            return {"success": True, "data": response.json()}
        except requests.exceptions.RequestException as e:
            error_content = e.response.json() if e.response else str(e)
            print(f"Error al enviar WhatsApp a Meta API: {error_content}")
            return {"success": False, "error": error_content}

# Creamos una única instancia global de nuestro servicio sin estado.
notificacion_service = NotificacionService()