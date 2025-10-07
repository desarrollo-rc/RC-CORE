// frontend/src/features/pedidos/components/ProductoSelectWithCreate.tsx
import { useEffect, useState, useRef } from 'react';
import { Select, Button, Group, Alert, Text } from '@mantine/core';
import { Controller, type Control } from 'react-hook-form';
import { IconPlus, IconSearch } from '@tabler/icons-react';
import { getAllProductos, createProducto } from '../../productos/services/productoService';
import type { Producto } from '../../productos/types';

interface ProductoSelectWithCreateProps {
    control: Control<any>;
    name: string;
    error?: string;
    selectedProductIds?: number[]; // IDs de productos ya seleccionados
    onProductCreated?: (producto: Producto) => void; // Callback cuando se crea un producto
    label?: string;
}

interface SelectOption {
    value: string;
    label: string;
}

export function ProductoSelectWithCreate({ 
    control, 
    name, 
    error, 
    selectedProductIds = [], 
    onProductCreated,
    label
}: ProductoSelectWithCreateProps) {
    const [productos, setProductos] = useState<SelectOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchValue, setSearchValue] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);
    const [currentSearchTerm, setCurrentSearchTerm] = useState('');
    const [lastCreatedOption, setLastCreatedOption] = useState<SelectOption | null>(null);
    const fieldOnChangeRef = useRef<((value: string) => void) | null>(null);

    // Los productos se filtran en el render para incluir el seleccionado actual

    useEffect(() => {
        const fetchProductos = async () => {
            try {
                const data = await getAllProductos();
                const options = data.map((producto: Producto) => ({
                    value: producto.id_producto.toString(),
                    label: `${producto.sku} - ${producto.nombre_producto || 'Producto sin nombre'}`,
                }));
                setProductos(options);
            } catch (error) {
                console.error("Error al cargar productos:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProductos();
    }, []);

    const handleSearchChange = (value: string) => {
        console.log('Search value changed:', value);
        setSearchValue(value);
        setCreateError(null);
        
        // Normalizar término: si viene "SKU - Nombre", tomar solo el SKU
        const rawTrimmed = value.trim();
        const rawSkuPart = rawTrimmed.split(' - ')[0];
        if (value) {
            setCurrentSearchTerm(rawSkuPart);
        }
        
        // Mostrar opción de crear si NO existe un SKU EXACTO
        // aunque existan coincidencias parciales
        const normalizedSkuPart = rawSkuPart.trim().toLowerCase();
        const hasExactSku = productos.some(p => {
            const skuPart = (p.label.split(' - ')[0] || '').trim().toLowerCase();
            return skuPart === normalizedSkuPart;
        });

        if (value && !hasExactSku) {
            setShowCreateForm(true);
        } else if (hasExactSku) {
            // Ocultar solo si encontramos coincidencia exacta
            setShowCreateForm(false);
        }
    };

    const handleSelectChange = (value: string | null) => {
        console.log('handleSelectChange called with value:', value);
        if (value) {
            setShowCreateForm(false);
            setSearchValue(''); // Limpiar searchValue cuando se selecciona
            setCurrentSearchTerm(''); // También limpiar currentSearchTerm
        }
    };

    const handleCreateProduct = async (field: any) => {
        console.log('=== CREATING PRODUCT ===');
        console.log('Current search term:', currentSearchTerm);
        console.log('Field value:', field.value);
        console.log('Component name:', name);
        if (!currentSearchTerm.trim()) {
            console.log('No search term, returning');
            return;
        }
        
        setCreating(true);
        setCreateError(null);
        
        try {
            // Crear producto con datos mínimos
            const newProduct = await createProducto({
                sku: currentSearchTerm.trim(),
                nombre_producto: `Producto ${currentSearchTerm.trim()}`, // Nombre temporal
                id_codigo_referencia: -1, // Valor por defecto - ajustar según tu sistema
                id_marca: -1, // Valor por defecto - ajustar según tu sistema
                id_calidad: -1, // Valor por defecto - ajustar según tu sistema
                id_origen: -1, // Valor por defecto - ajustar según tu sistema
                id_fabrica: null,
                costo_base: 0,
                es_kit: false,
                proveedores: [{
                    id_proveedor: -1, // Proveedor por defecto
                    costo_proveedor: 0,
                    codigo_producto_proveedor: currentSearchTerm.trim(),
                    es_proveedor_principal: true
                }]
            });
            
            console.log('Product created successfully:', newProduct);

            // Agregar a la lista de productos
            const newOption = {
                value: newProduct.id_producto.toString(),
                label: `${newProduct.sku} - ${newProduct.nombre_producto}`,
            };
            
            setProductos(prev => [...prev, newOption]);
            setLastCreatedOption(newOption);
            
            // Notificar al componente padre PRIMERO
            if (onProductCreated) {
                onProductCreated(newProduct);
            }
            
            // Seleccionar el producto recién creado SOLO en este componente
            const productId = newProduct.id_producto.toString();
            console.log('Setting field value to:', productId, 'for component:', name);
            
            // Establecer el valor inmediatamente
            field.onChange(productId);
            console.log('Field value set:', productId);
            
            // Limpiar formulario después de establecer el valor
            setTimeout(() => {
                setSearchValue('');
                setCurrentSearchTerm('');
                setShowCreateForm(false);
                setLastCreatedOption(null);
            }, 100);
            
            
            console.log('Product added to list and selected:', newProduct.id_producto);
            
        } catch (error: any) {
            setCreateError(error.response?.data?.error || 'Error al crear el producto');
        } finally {
            setCreating(false);
        }
    };

    return (
        <div>
            <Controller
                name={name}
                control={control}
                render={({ field }) => {
                    // Guardar la función onChange del field en el ref
                    fieldOnChangeRef.current = field.onChange;
                    
                    // Filtrar productos ya seleccionados, pero incluir el producto actualmente seleccionado
                    const filteredProductos = productos.filter(p => {
                        const productId = parseInt(p.value);
                        return !selectedProductIds.includes(productId) || productId === parseInt(field.value || '0');
                    });

                    // Asegurar que el valor seleccionado exista en data con una etiqueta visible
                    const selectedId = field.value ? parseInt(field.value, 10) : null;
                    let selectedOption = selectedId != null ? productos.find(p => parseInt(p.value, 10) === selectedId) : null;
                    // fallback a la última opción creada si coincide con el id actual
                    if (!selectedOption && lastCreatedOption && selectedId === parseInt(lastCreatedOption.value, 10)) {
                        selectedOption = lastCreatedOption;
                    }
                    const isSelectedInList = selectedOption && filteredProductos.some(p => p.value === selectedOption!.value);
                    const dataToShow = isSelectedInList || !selectedOption ? filteredProductos : [...filteredProductos, selectedOption];

                    console.log('Render ProductoSelectWithCreate - name:', name, 'field.value:', field.value, 'searchValue:', searchValue, 'dataToShow:', dataToShow.length);
                    return (
                    <>
                        <Select
                            label={label}
                            placeholder="Busque por SKU o nombre"
                            data={dataToShow}
                            searchable
                            clearable
                            nothingFoundMessage="No se encontraron productos"
                            disabled={loading}
                            searchValue={searchValue}
                            onSearchChange={handleSearchChange}
                            onChange={(value) => {
                                console.log('Select onChange triggered with value:', value);
                                field.onChange(value);
                                handleSelectChange(value);
                            }}
                            value={field.value}
                            error={error}
                        />
                    </>
                    );
                }}
            />
            {showCreateForm && (
                <Alert 
                    color="blue" 
                    title="Producto no encontrado" 
                    mt="sm"
                    icon={<IconSearch size={16} />}
                >
                    <Text size="sm" mb="md">
                        No se encontró un producto con SKU "{currentSearchTerm}". 
                        ¿Desea crear uno nuevo?
                    </Text>
                    
                    {createError && (
                        <Alert color="red" mb="md">
                            {createError}
                        </Alert>
                    )}
                    
                    <Group>
                        <Button
                            onMouseDown={(e) => e.preventDefault()}
                            size="xs"
                            leftSection={<IconPlus size={14} />}
                            onClick={() => {
                                console.log('Button clicked!');
                                console.log('Current search term at click:', currentSearchTerm);
                                // Usar el ref para acceder al onChange del field
                                if (fieldOnChangeRef.current) {
                                    handleCreateProduct({ 
                                        value: '',
                                        onChange: fieldOnChangeRef.current
                                    });
                                }
                            }}
                            loading={creating}
                        >
                            Crear Producto
                        </Button>
                        <Button
                            onMouseDown={(e) => e.preventDefault()}
                            size="xs"
                            variant="light"
                            onClick={() => {
                                setShowCreateForm(false);
                                setSearchValue('');
                                setCurrentSearchTerm('');
                            }}
                        >
                            Cancelar
                        </Button>
                    </Group>
                </Alert>
            )}
        </div>
    );
}
