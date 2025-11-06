// frontend/src/features/productos/components/ProductoImagenesModal.tsx
import { useState, useEffect } from 'react';
import { Modal, Box, Text, Stack, ActionIcon, Center, Loader, Alert } from '@mantine/core';
import { IconChevronLeft, IconChevronRight, IconPhotoOff } from '@tabler/icons-react';

interface ProductoImagenesModalProps {
  opened: boolean;
  onClose: () => void;
  sku: string;
  imageUrls: string[];
  loading?: boolean;
}

export function ProductoImagenesModal({ 
  opened, 
  onClose, 
  sku, 
  imageUrls, 
  loading = false 
}: ProductoImagenesModalProps) {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [imageError, setImageError] = useState(false);

  // Resetear índice cuando se abre el modal o cambian las imágenes
  useEffect(() => {
    if (opened) {
      setCurrentIndex(0);
      setImageError(false);
    }
  }, [opened, imageUrls]);

  const handlePrev = () => {
    if (imageUrls.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + imageUrls.length) % imageUrls.length);
    setImageError(false);
  };

  const handleNext = () => {
    if (imageUrls.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % imageUrls.length);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  // Procesar URLs: convertir relativas a absolutas
  const getImageUrl = (url: string): string => {
    if (!url) return '';
    
    // Si ya es Base64
    if (url.startsWith('data:image/')) {
      return url;
    }
    
    // Si es URL relativa, construir absoluta
    if (url.startsWith('/')) {
      const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000/api/v1';
      return `${backendUrl}${url}`;
    }
    
    // Si es URL absoluta, usar directamente
    return url;
  };

  const currentImageUrl = imageUrls.length > 0 && currentIndex < imageUrls.length
    ? getImageUrl(imageUrls[currentIndex])
    : '';

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`Imágenes del producto: ${sku}`}
      size="lg"
      centered
    >
      {loading ? (
        <Center py="xl">
          <Stack align="center" gap="md">
            <Loader size="lg" />
            <Text size="sm" c="dimmed">Cargando imágenes...</Text>
          </Stack>
        </Center>
      ) : imageUrls.length === 0 ? (
        <Alert icon={<IconPhotoOff size={16} />} title="Sin imágenes" color="gray">
          No se encontraron imágenes para este producto.
        </Alert>
      ) : (
        <Box>
          <Stack gap="md">
            <Box style={{ position: 'relative', minHeight: '300px' }}>
              <Text size="sm" fw={500} mb="xs">
                Imagen {currentIndex + 1} de {imageUrls.length}
              </Text>
              
              {imageError ? (
                <Center py="xl" style={{ border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                  <Stack align="center" gap="xs">
                    <IconPhotoOff size={48} color="gray" />
                    <Text size="sm" c="dimmed">Error al cargar la imagen</Text>
                  </Stack>
                </Center>
              ) : (
                <img
                  src={currentImageUrl}
                  alt={`Imagen ${currentIndex + 1} del producto ${sku}`}
                  style={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: '420px',
                    objectFit: 'contain',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px'
                  }}
                  onError={handleImageError}
                />
              )}

              {imageUrls.length > 1 && (
                <>
                  <ActionIcon
                    variant="light"
                    color="gray"
                    onClick={handlePrev}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: 10,
                      transform: 'translateY(-50%)',
                      zIndex: 10
                    }}
                    aria-label="Imagen anterior"
                  >
                    <IconChevronLeft size={18} />
                  </ActionIcon>
                  <ActionIcon
                    variant="light"
                    color="gray"
                    onClick={handleNext}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      right: 10,
                      transform: 'translateY(-50%)',
                      zIndex: 10
                    }}
                    aria-label="Siguiente imagen"
                  >
                    <IconChevronRight size={18} />
                  </ActionIcon>
                </>
              )}
            </Box>

            {imageUrls.length > 1 && (
              <Box style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {imageUrls.map((url, index) => (
                  <Box
                    key={index}
                    onClick={() => {
                      setCurrentIndex(index);
                      setImageError(false);
                    }}
                    style={{
                      width: '60px',
                      height: '60px',
                      border: currentIndex === index ? '2px solid #228be6' : '1px solid #e0e0e0',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      opacity: currentIndex === index ? 1 : 0.7,
                      transition: 'opacity 0.2s'
                    }}
                  >
                    <img
                      src={getImageUrl(url)}
                      alt={`Miniatura ${index + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  </Box>
                ))}
              </Box>
            )}
          </Stack>
        </Box>
      )}
    </Modal>
  );
}

