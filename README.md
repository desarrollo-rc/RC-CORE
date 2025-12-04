# RC-CORE: Sistema de Gestión Repuesto Center

Sistema ERP/CRM Full Stack para la gestión de pedidos B2B, inventario y automatizaciones.

## Arquitectura
- **Backend:** Python (Flask), SQLAlchemy, PostgreSQL.
- **Frontend:** React 19, TypeScript, Vite, Mantine UI. (pnpm)
- **Automatización:** Integración con Gmail API (pedidos) y Playwright (gestión de sistemas externos). REQUIERE credentials.json

## Prerrequisitos
- Python 3.10+
- Node.js 18+
- PostgreSQL
- Driver ODBC 18 for SQL Server (para conexión legacy)

## Configuración Rápida

### 1. Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # O venv\Scripts\activate en Windows
pip install -r requirements.txt

# Configurar variables de entorno
.env backend
.env frontend

# Inicializar Base de Datos
flask db upgrade
flask run

# Frontend
cd frontend
pnpm install
pnpm dev