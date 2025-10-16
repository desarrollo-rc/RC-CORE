# backend/app/api/v1/services/informes_service.py
from datetime import datetime, timedelta
from decimal import Decimal
from typing import List, Dict, Any
from app.extensions import db
from app.models.negocio.pedidos import Pedido, PedidoDetalle, EstadoPedido
from app.models.entidades.maestro_clientes import MaestroClientes
from app.models.productos.maestro_productos import MaestroProductos
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
import io
import pandas as pd

class InformesService:
    
    @staticmethod
    def generar_informe_corte(fecha: str, hora: int) -> bytes:
        """
        Genera un informe PDF de corte para una fecha y hora específica.
        Incluye todos los pedidos desde el día anterior a la hora de corte hasta el día seleccionado a la hora de corte.
        """
        # Parsear fecha
        fecha_obj = datetime.strptime(fecha, '%Y-%m-%d')
        fecha_corte = fecha_obj.replace(hour=hora, minute=0, second=0, microsecond=0)
        
        # Calcular rango de fechas: desde el día anterior a la hora de corte hasta el día seleccionado a la hora de corte
        fecha_inicio = fecha_corte - timedelta(days=1)
        fecha_fin = fecha_corte
        
        # Obtener pedidos en el rango de fechas
        pedidos = db.session.query(Pedido).filter(
            Pedido.fecha_creacion >= fecha_inicio,
            Pedido.fecha_creacion <= fecha_fin
        ).order_by(Pedido.fecha_creacion.desc()).all()
        
        # Crear PDF en memoria
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer, 
            pagesize=A4,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=18
        )
        styles = getSampleStyleSheet()
        story = []
        
        # Colores institucionales
        COLOR_INSTITUCIONAL = colors.HexColor('#FF0000')  # Rojo institucional
        COLOR_GRIS_OSCURO = colors.HexColor('#333333')
        COLOR_GRIS_CLARO = colors.HexColor('#F5F5F5')
        
        # Estilos personalizados
        title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Heading1'],
            fontSize=28,
            spaceAfter=20,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold',
            textColor=COLOR_INSTITUCIONAL
        )
        
        subtitle_style = ParagraphStyle(
            'ReportSubtitle',
            parent=styles['Heading2'],
            fontSize=16,
            spaceAfter=15,
            alignment=TA_CENTER,
            fontName='Helvetica',
            textColor=COLOR_GRIS_OSCURO
        )
        
        info_style = ParagraphStyle(
            'InfoStyle',
            parent=styles['Normal'],
            fontSize=12,
            spaceAfter=12,
            fontName='Helvetica',
            textColor=COLOR_GRIS_OSCURO
        )
        
        # Header
        story.append(Spacer(1, 30))
        story.append(Paragraph("REPUESTO CENTER", title_style))
        story.append(Paragraph("INFORME DE CORTE", subtitle_style))
        
        # Información del corte
        story.append(Spacer(1, 25))
        story.append(Paragraph(f"<b>Fecha de Corte:</b> {fecha_corte.strftime('%d/%m/%Y %H:%M')}", info_style))
        story.append(Paragraph(f"<b>Período Analizado:</b> {fecha_inicio.strftime('%d/%m/%Y %H:%M')} - {fecha_fin.strftime('%d/%m/%Y %H:%M')}", info_style))
        
        # Calcular totales
        total_pedidos = len(pedidos)
        monto_total = sum(float(p.monto_total or 0) for p in pedidos)
        
        # Métricas principales
        metrics_data = [
            ['MÉTRICA', 'VALOR'],
            ['Total de Pedidos', f"{total_pedidos:,}"],
            ['Monto Total', f"${monto_total:,.0f}"]
        ]
        
        metrics_table = Table(metrics_data, colWidths=[3.5*inch, 2*inch])
        metrics_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), COLOR_INSTITUCIONAL),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (1, 1), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 14),
            ('FONTSIZE', (0, 1), (-1, -1), 12),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 15),
            ('TOPPADDING', (0, 0), (-1, -1), 15),
            ('BACKGROUND', (0, 1), (0, -1), COLOR_GRIS_CLARO),
            ('BACKGROUND', (1, 1), (1, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 1, COLOR_GRIS_OSCURO),
        ]))
        story.append(metrics_table)
        
        # Footer de la primera página
        story.append(Spacer(1, 30))
        footer_style = ParagraphStyle(
            'Footer',
            parent=styles['Normal'],
            fontSize=10,
            alignment=TA_CENTER,
            textColor=COLOR_GRIS_OSCURO
        )
        story.append(Paragraph(f"Informe generado el {datetime.now().strftime('%d/%m/%Y a las %H:%M')}", footer_style))
        story.append(Paragraph("RC CORE - Sistema de gestión Repuesto Center", footer_style))
        
        # Salto de página para la lista de pedidos
        story.append(PageBreak())
        
        # PÁGINA 2: LISTA DE PEDIDOS
        story.append(Spacer(1, 30))
        story.append(Paragraph("LISTA DE PEDIDOS", subtitle_style))
        story.append(Spacer(1, 20))
        
        # Tabla de pedidos en el período
        if pedidos:
            data = [['#', 'Código B2B', 'Cliente', 'Fecha Creación', 'Estado', 'Monto']]
            
            for i, pedido in enumerate(pedidos, 1):  # Todos los pedidos en el período
                cliente_nombre = "N/A"
                if pedido.id_cliente:
                    cliente = db.session.query(MaestroClientes).filter_by(id_cliente=pedido.id_cliente).first()
                    if cliente:
                        # Mostrar nombre completo, truncar solo si es muy largo
                        cliente_nombre = cliente.nombre_cliente
                        if len(cliente_nombre) > 40:
                            cliente_nombre = cliente_nombre[:37] + "..."
                
                # Obtener estado real del pedido
                estado_nombre = "N/A"
                if hasattr(pedido, 'estado_general') and pedido.estado_general:
                    estado_nombre = pedido.estado_general.nombre_estado
                
                data.append([
                    str(i),
                    pedido.codigo_pedido_origen or f"#{pedido.id_pedido}",
                    cliente_nombre,
                    pedido.fecha_creacion.strftime('%d/%m/%Y %H:%M') if pedido.fecha_creacion else 'N/A',
                    estado_nombre,
                    f"${float(pedido.monto_total or 0):,.0f}"
                ])
            
            table = Table(data, colWidths=[0.5*inch, 1.2*inch, 2.8*inch, 1.2*inch, 1*inch, 1*inch])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), COLOR_INSTITUCIONAL),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (0, 0), (0, -1), 'CENTER'),  # Columna #
                ('ALIGN', (1, 1), (1, -1), 'CENTER'),  # Columna Código
                ('ALIGN', (2, 1), (2, -1), 'LEFT'),    # Columna Cliente
                ('ALIGN', (3, 1), (3, -1), 'CENTER'),  # Columna Fecha
                ('ALIGN', (4, 1), (4, -1), 'CENTER'),  # Columna Estado
                ('ALIGN', (5, 1), (5, -1), 'CENTER'),  # Columna Monto
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTNAME', (2, 1), (2, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('FONTSIZE', (0, 1), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('BACKGROUND', (0, 1), (-1, -1), colors.white),
                ('GRID', (0, 0), (-1, -1), 1, COLOR_GRIS_OSCURO),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, COLOR_GRIS_CLARO]),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ]))
            
            story.append(table)
        else:
            story.append(Paragraph("No hay pedidos en el período especificado.", info_style))
        
        # Construir PDF
        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()
    
    @staticmethod
    def generar_informe_mensual(mes: int, año: int) -> bytes:
        """
        Genera un informe PDF mensual profesional con estadísticas del mes.
        """
        # Calcular fechas del mes
        fecha_inicio = datetime(año, mes, 1)
        if mes == 12:
            fecha_fin = datetime(año + 1, 1, 1) - timedelta(seconds=1)
        else:
            fecha_fin = datetime(año, mes + 1, 1) - timedelta(seconds=1)
        
        # Obtener pedidos del mes (excluyendo cancelados)
        pedidos = db.session.query(Pedido).filter(
            Pedido.fecha_creacion >= fecha_inicio,
            Pedido.fecha_creacion <= fecha_fin
        ).all()
        
        # Crear PDF en memoria
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer, 
            pagesize=A4,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=18
        )
        styles = getSampleStyleSheet()
        story = []
        
        # Colores institucionales
        COLOR_INSTITUCIONAL = colors.HexColor('#FF0000')  # Rojo institucional
        COLOR_GRIS_OSCURO = colors.HexColor('#333333')
        COLOR_GRIS_CLARO = colors.HexColor('#F5F5F5')
        
        # Estilos personalizados
        title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Heading1'],
            fontSize=28,
            spaceAfter=20,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold',
            textColor=COLOR_INSTITUCIONAL
        )
        
        subtitle_style = ParagraphStyle(
            'ReportSubtitle',
            parent=styles['Heading2'],
            fontSize=16,
            spaceAfter=15,
            alignment=TA_CENTER,
            fontName='Helvetica',
            textColor=COLOR_GRIS_OSCURO
        )
        
        section_style = ParagraphStyle(
            'SectionTitle',
            parent=styles['Heading3'],
            fontSize=18,
            spaceAfter=20,
            spaceBefore=30,
            fontName='Helvetica-Bold',
            textColor=colors.white,
            borderWidth=0,
            borderPadding=15,
            backColor=COLOR_INSTITUCIONAL,
            alignment=TA_CENTER,
            leftIndent=0,
            rightIndent=0
        )
        
        info_style = ParagraphStyle(
            'InfoStyle',
            parent=styles['Normal'],
            fontSize=12,
            spaceAfter=12,
            fontName='Helvetica',
            textColor=COLOR_GRIS_OSCURO
        )
        
        # Estilo para números grandes
        big_number_style = ParagraphStyle(
            'BigNumber',
            parent=styles['Heading2'],
            fontSize=20,
            fontName='Helvetica-Bold',
            textColor=COLOR_INSTITUCIONAL,
            alignment=TA_CENTER
        )
        
        # Calcular estadísticas
        total_pedidos = len(pedidos)
        monto_total = sum(float(p.monto_total or 0) for p in pedidos)
        monto_neto = monto_total / 1.19  # Quitar IVA
        monto_iva = monto_total - monto_neto
        
        # PÁGINA 1: RESUMEN EJECUTIVO
        story.append(Spacer(1, 30))
        story.append(Paragraph("REPUESTO CENTER", title_style))
        story.append(Paragraph("INFORME MENSUAL DE VENTAS", subtitle_style))
        
        meses_nombres = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
        story.append(Paragraph(f"{meses_nombres[mes].upper()} {año}", subtitle_style))
        
        story.append(Spacer(1, 25))
        story.append(Paragraph("RESUMEN EJECUTIVO", section_style))
        
        # Métricas principales en formato destacado
        story.append(Spacer(1, 20))
        
        # Crear tabla de métricas principales
        metrics_data = [
            ['MÉTRICA', 'VALOR'],
            ['Total de Pedidos', f"{total_pedidos:,}"],
            ['Ventas Netas (sin IVA)', f"${monto_neto:,.0f}"],
            ['IVA (19%)', f"${monto_iva:,.0f}"],
            ['TOTAL VENTAS', f"${monto_total:,.0f}"],
            ['Promedio por Pedido', f"${monto_total/total_pedidos:,.0f}" if total_pedidos > 0 else "$0"]
        ]
        
        metrics_table = Table(metrics_data, colWidths=[3.5*inch, 2*inch])
        metrics_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), COLOR_INSTITUCIONAL),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (1, 1), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 14),
            ('FONTSIZE', (0, 1), (-1, -1), 12),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 15),
            ('TOPPADDING', (0, 0), (-1, -1), 15),
            ('BACKGROUND', (0, 1), (0, -2), COLOR_GRIS_CLARO),
            ('BACKGROUND', (1, 1), (1, -2), colors.white),
            ('GRID', (0, 0), (-1, -1), 1, COLOR_GRIS_OSCURO),
            # Destacar la fila TOTAL VENTAS
            ('FONTNAME', (0, -2), (-1, -2), 'Helvetica-Bold'),
            ('FONTSIZE', (0, -2), (-1, -2), 16),
            ('BACKGROUND', (0, -2), (-1, -2), COLOR_INSTITUCIONAL),
            ('TEXTCOLOR', (0, -2), (-1, -2), colors.white),
        ]))
        story.append(metrics_table)
        
        # Información del período
        story.append(Spacer(1, 20))
        periodo_info = Paragraph(f"<b>Período analizado:</b> {fecha_inicio.strftime('%d de %B de %Y')} al {fecha_fin.strftime('%d de %B de %Y')}", info_style)
        story.append(periodo_info)
        
        # Salto de página
        story.append(PageBreak())
        
        # PÁGINA 2: TOP CLIENTES
        story.append(Spacer(1, 30))
        story.append(Paragraph("TOP 10 CLIENTES DEL MES", subtitle_style))
        story.append(Paragraph(f"{meses_nombres[mes].upper()} {año}", subtitle_style))
        
        story.append(Spacer(1, 20))
        
        clientes_stats = InformesService._calcular_top_clientes(pedidos)
        if clientes_stats:
            clientes_data = [['#', 'Cliente', 'Pedidos', 'Monto Total', '% del Total']]
            
            for i, cliente in enumerate(clientes_stats[:10], 1):
                porcentaje = (cliente['monto'] / monto_total * 100) if monto_total > 0 else 0
                # Truncar nombre de manera más inteligente
                nombre_cliente = cliente['nombre']
                if len(nombre_cliente) > 35:
                    nombre_cliente = nombre_cliente[:32] + "..."
                
                clientes_data.append([
                    str(i),
                    nombre_cliente,
                    f"{cliente['pedidos']:,}",
                    f"${cliente['monto']:,.0f}",
                    f"{porcentaje:.1f}%"
                ])
            
            clientes_table = Table(clientes_data, colWidths=[0.6*inch, 3*inch, 1*inch, 1.4*inch, 1*inch])
            clientes_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), COLOR_INSTITUCIONAL),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (0, 0), (0, -1), 'CENTER'),
                ('ALIGN', (1, 1), (1, -1), 'LEFT'),
                ('ALIGN', (2, 1), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTNAME', (1, 1), (1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('FONTSIZE', (0, 1), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
                ('TOPPADDING', (0, 0), (-1, -1), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.white),
                ('GRID', (0, 0), (-1, -1), 1, COLOR_GRIS_OSCURO),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, COLOR_GRIS_CLARO]),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ]))
            story.append(clientes_table)
        else:
            story.append(Paragraph("No hay datos de clientes disponibles para el período seleccionado.", info_style))
        
        # Salto de página
        story.append(PageBreak())
        
        # PÁGINA 3: TOP PRODUCTOS
        story.append(Spacer(1, 30))
        story.append(Paragraph("TOP 20 PRODUCTOS MÁS VENDIDOS", subtitle_style))
        story.append(Paragraph(f"{meses_nombres[mes].upper()} {año}", subtitle_style))
        
        story.append(Spacer(1, 15))
        
        productos_stats = InformesService._calcular_top_productos(pedidos)
        if productos_stats:
            productos_data = [['#', 'SKU', 'Producto', 'Cantidad', 'Monto', '% del Total']]
            
            total_productos = sum(p['monto'] for p in productos_stats)
            for i, producto in enumerate(productos_stats[:20], 1):
                porcentaje = (producto['monto'] / total_productos * 100) if total_productos > 0 else 0
                
                # Truncar SKU y nombre de manera más inteligente
                sku_producto = producto['sku']
                if len(sku_producto) > 12:
                    sku_producto = sku_producto[:9] + "..."
                
                nombre_producto = producto['nombre']
                if len(nombre_producto) > 25:
                    nombre_producto = nombre_producto[:22] + "..."
                
                productos_data.append([
                    str(i),
                    sku_producto,
                    nombre_producto,
                    f"{producto['cantidad']:,}",
                    f"${producto['monto']:,.0f}",
                    f"{porcentaje:.1f}%"
                ])
            
            productos_table = Table(productos_data, colWidths=[0.4*inch, 1.1*inch, 2.3*inch, 0.9*inch, 1.1*inch, 0.9*inch])
            productos_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), COLOR_INSTITUCIONAL),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (0, 0), (0, -1), 'CENTER'),
                ('ALIGN', (1, 1), (1, -1), 'CENTER'),
                ('ALIGN', (2, 1), (2, -1), 'LEFT'),
                ('ALIGN', (3, 1), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTNAME', (2, 1), (2, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, 0), 9),
                ('FONTSIZE', (0, 1), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('TOPPADDING', (0, 0), (-1, -1), 4),
                ('BACKGROUND', (0, 1), (-1, -1), colors.white),
                ('GRID', (0, 0), (-1, -1), 1, COLOR_GRIS_OSCURO),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, COLOR_GRIS_CLARO]),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ]))
            story.append(productos_table)
        else:
            story.append(Paragraph("No hay datos de productos disponibles para el período seleccionado.", info_style))
        
        # Footer en la última página
        story.append(Spacer(1, 20))
        footer_style = ParagraphStyle(
            'Footer',
            parent=styles['Normal'],
            fontSize=9,
            alignment=TA_CENTER,
            textColor=COLOR_GRIS_OSCURO
        )
        story.append(Paragraph(f"Informe generado el {datetime.now().strftime('%d/%m/%Y a las %H:%M')}", footer_style))
        story.append(Paragraph("RC CORE - Sistema de gestión Repuesto Center", footer_style))
        
        # Construir PDF
        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()
    
    @staticmethod
    def _calcular_top_clientes(pedidos: List[Pedido]) -> List[Dict[str, Any]]:
        """Calcula estadísticas de clientes."""
        clientes_stats = {}
        
        for pedido in pedidos:
            if not pedido.id_cliente:
                continue
                
            cliente = db.session.query(MaestroClientes).filter_by(id_cliente=pedido.id_cliente).first()
            if not cliente:
                continue
                
            cliente_key = cliente.id_cliente
            if cliente_key not in clientes_stats:
                clientes_stats[cliente_key] = {
                    'nombre': cliente.nombre_cliente,
                    'pedidos': 0,
                    'monto': 0.0
                }
            
            clientes_stats[cliente_key]['pedidos'] += 1
            clientes_stats[cliente_key]['monto'] += float(pedido.monto_total or 0)
        
        # Ordenar por monto total
        return sorted(clientes_stats.values(), key=lambda x: x['monto'], reverse=True)
    
    @staticmethod
    def _calcular_top_productos(pedidos: List[Pedido]) -> List[Dict[str, Any]]:
        """Calcula estadísticas de productos."""
        productos_stats = {}
        
        for pedido in pedidos:
            detalles = db.session.query(PedidoDetalle).filter_by(id_pedido=pedido.id_pedido).all()
            
            for detalle in detalles:
                producto = db.session.query(MaestroProductos).filter_by(id_producto=detalle.id_producto).first()
                if not producto:
                    continue
                
                producto_key = producto.id_producto
                if producto_key not in productos_stats:
                    productos_stats[producto_key] = {
                        'sku': producto.sku,
                        'nombre': producto.nombre_producto,
                        'cantidad': 0,
                        'monto': 0.0
                    }
                
                productos_stats[producto_key]['cantidad'] += int(detalle.cantidad or 0)
                productos_stats[producto_key]['monto'] += float(detalle.subtotal or 0)
        
        # Ordenar por cantidad vendida
        return sorted(productos_stats.values(), key=lambda x: x['cantidad'], reverse=True)
    
    @staticmethod
    def generar_informe_corte_excel(fecha: str, hora: int) -> bytes:
        """
        Genera un informe de corte en formato Excel.
        """
        # Parsear fecha
        fecha_obj = datetime.strptime(fecha, '%Y-%m-%d')
        fecha_corte = fecha_obj.replace(hour=hora, minute=0, second=0, microsecond=0)
        
        # Calcular rango de fechas
        fecha_inicio = fecha_corte - timedelta(days=1)
        fecha_fin = fecha_corte
        
        # Obtener pedidos en el rango de fechas
        pedidos = db.session.query(Pedido).filter(
            Pedido.fecha_creacion >= fecha_inicio,
            Pedido.fecha_creacion <= fecha_fin
        ).order_by(Pedido.fecha_creacion.desc()).all()
        
        # Preparar datos para Excel
        data = []
        for i, pedido in enumerate(pedidos, 1):
            cliente_nombre = "N/A"
            if pedido.id_cliente:
                cliente = db.session.query(MaestroClientes).filter_by(id_cliente=pedido.id_cliente).first()
                if cliente:
                    cliente_nombre = cliente.nombre_cliente
            
            estado_nombre = "N/A"
            if hasattr(pedido, 'estado_general') and pedido.estado_general:
                estado_nombre = pedido.estado_general.nombre_estado
            
            data.append({
                '#': i,
                'Código B2B': pedido.codigo_pedido_origen or f"#{pedido.id_pedido}",
                'Cliente': cliente_nombre,
                'Fecha Creación': pedido.fecha_creacion.strftime('%d/%m/%Y %H:%M') if pedido.fecha_creacion else 'N/A',
                'Estado': estado_nombre,
                'Monto': float(pedido.monto_total or 0)
            })
        
        # Crear DataFrame
        df = pd.DataFrame(data)
        
        # Crear archivo Excel en memoria
        buffer = io.BytesIO()
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Informe de Corte', index=False)
            
            # Obtener el workbook y worksheet
            workbook = writer.book
            worksheet = writer.sheets['Informe de Corte']
            
            # Ajustar ancho de columnas
            for column in worksheet.columns:
                max_length = 0
                column_letter = column[0].column_letter
                for cell in column:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                adjusted_width = min(max_length + 2, 50)
                worksheet.column_dimensions[column_letter].width = adjusted_width
        
        buffer.seek(0)
        return buffer.getvalue()
    
    @staticmethod
    def generar_informe_mensual_excel(mes: int, año: int) -> bytes:
        """
        Genera un informe mensual en formato Excel.
        """
        # Calcular fechas del mes
        fecha_inicio = datetime(año, mes, 1)
        if mes == 12:
            fecha_fin = datetime(año + 1, 1, 1) - timedelta(seconds=1)
        else:
            fecha_fin = datetime(año, mes + 1, 1) - timedelta(seconds=1)
        
        # Obtener pedidos del mes
        pedidos = db.session.query(Pedido).filter(
            Pedido.fecha_creacion >= fecha_inicio,
            Pedido.fecha_creacion <= fecha_fin
        ).all()
        
        # Calcular estadísticas
        total_pedidos = len(pedidos)
        monto_total = sum(float(p.monto_total or 0) for p in pedidos)
        monto_neto = monto_total / 1.19
        monto_iva = monto_total - monto_neto
        
        # Top Clientes
        clientes_stats = InformesService._calcular_top_clientes(pedidos)
        clientes_data = []
        for i, cliente in enumerate(clientes_stats[:10], 1):
            porcentaje = (cliente['monto'] / monto_total * 100) if monto_total > 0 else 0
            clientes_data.append({
                '#': i,
                'Cliente': cliente['nombre'],
                'Pedidos': cliente['pedidos'],
                'Monto Total': cliente['monto'],
                '% del Total': round(porcentaje, 1)
            })
        
        # Top Productos
        productos_stats = InformesService._calcular_top_productos(pedidos)
        productos_data = []
        total_productos = sum(p['monto'] for p in productos_stats)
        for i, producto in enumerate(productos_stats[:20], 1):
            porcentaje = (producto['monto'] / total_productos * 100) if total_productos > 0 else 0
            productos_data.append({
                '#': i,
                'SKU': producto['sku'],
                'Producto': producto['nombre'],
                'Cantidad': producto['cantidad'],
                'Monto': producto['monto'],
                '% del Total': round(porcentaje, 1)
            })
        
        # Crear archivo Excel en memoria
        buffer = io.BytesIO()
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            # Resumen
            resumen_data = {
                'Métrica': ['Período Analizado', 'Total de Pedidos', 'Ventas Netas (sin IVA)', 'IVA (19%)', 'TOTAL VENTAS', 'Promedio por Pedido'],
                'Valor': [
                    f"{fecha_inicio.strftime('%d/%m/%Y')} - {fecha_fin.strftime('%d/%m/%Y')}",
                    total_pedidos,
                    f"${monto_neto:,.0f}",
                    f"${monto_iva:,.0f}",
                    f"${monto_total:,.0f}",
                    f"${monto_total/total_pedidos:,.0f}" if total_pedidos > 0 else "$0"
                ]
            }
            pd.DataFrame(resumen_data).to_excel(writer, sheet_name='Resumen', index=False)
            
            # Top Clientes
            pd.DataFrame(clientes_data).to_excel(writer, sheet_name='Top Clientes', index=False)
            
            # Top Productos
            pd.DataFrame(productos_data).to_excel(writer, sheet_name='Top Productos', index=False)
            
            # Ajustar columnas en todas las hojas
            for sheet_name in ['Resumen', 'Top Clientes', 'Top Productos']:
                worksheet = writer.sheets[sheet_name]
                for column in worksheet.columns:
                    max_length = 0
                    column_letter = column[0].column_letter
                    for cell in column:
                        try:
                            if len(str(cell.value)) > max_length:
                                max_length = len(str(cell.value))
                        except:
                            pass
                    adjusted_width = min(max_length + 2, 50)
                    worksheet.column_dimensions[column_letter].width = adjusted_width
        
        buffer.seek(0)
        return buffer.getvalue()
