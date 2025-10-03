// frontend/src/features/pedidos/components/ProductoSelectWithCreate.tsx
import { useEffect, useState } from 'react';
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
    onProductCreated 
}: ProductoSelectWithCreateProps) {
    const [productos, setProductos] = useState<SelectOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchValue, setSearchValue] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);
    const [currentSearchTerm, setCurrentSearchTerm] = useState('');
    const [forceRerender, setForceRerender] = useState(0); // Para forzar re-render
    const [lastCreatedOption, setLastCreatedOption] = useState<SelectOption | null>(null);

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
        
        // Solo actualizar currentSearchTerm si hay un valor
        if (value) {
            setCurrentSearchTerm(value);
        }
        
        // Si no hay resultados y el usuario está buscando algo, mostrar opción de crear
        const hasResults = productos.some(p => 
            p.label.toLowerCase().includes(value.toLowerCase())
        );
        
        console.log('Has results:', hasResults, 'Total products:', productos.length);
        
        if (value && !hasResults) {
            console.log('Showing create form');
            setShowCreateForm(true);
        } else if (!value && !showCreateForm) {
            // Solo ocultar si no estamos en modo creación
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
            
            // Limpiar formulario primero
            setSearchValue('');
            setCurrentSearchTerm('');
            setShowCreateForm(false);
            
            // Establecer el valor tras el siguiente tick para asegurar datos cargados
            setTimeout(() => {
                field.onChange(productId);
                console.log('Field value set (next tick):', productId);
            }, 0);
            
            // Forzar limpieza del searchValue después de un breve delay
            setTimeout(() => {
                setSearchValue('');
                console.log('SearchValue cleared after timeout');
            }, 100);
            
            // Forzar re-render del componente
            setForceRerender(prev => prev + 1);
            console.log('Force rerender triggered');
            
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
                            key={`select-${field.value}-${forceRerender}`} // Forzar re-render cuando cambie el valor o se fuerce
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
                                        size="xs"
                                        leftSection={<IconPlus size={14} />}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            console.log('Button clicked!');
                                            console.log('Current search term at click:', currentSearchTerm);
                                            handleCreateProduct(field);
                                        }}
                                        loading={creating}
                                    >
                                        Crear Producto
                                    </Button>
                                    <Button
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
                    </>
                    );
                }}
            />
        </div>
    );
}
