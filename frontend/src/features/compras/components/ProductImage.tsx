// frontend/src/features/compras/components/ProductImage.tsx
import { useState } from 'react';
import { Image, Modal, Box, Text, Stack, ActionIcon } from '@mantine/core';
import { IconZoomIn, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';

interface ProductImageProps {
  src: string;
  alt: string;
  numeroArticulo: string;
  size?: number;
  todasLasImagenes?: string[];
}

export function ProductImage({ src, alt, numeroArticulo, size = 50, todasLasImagenes }: ProductImageProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const [imageError, setImageError] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleOpen = () => {
    if (todasLasImagenes && todasLasImagenes.length > 0) {
      const initialIndex = Math.max(0, todasLasImagenes.findIndex((img) => img === src));
      setCurrentIndex(initialIndex >= 0 ? initialIndex : 0);
    } else {
      setCurrentIndex(0);
    }
    open();
  };

  const handlePrev = () => {
    if (!todasLasImagenes || todasLasImagenes.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + todasLasImagenes.length) % todasLasImagenes.length);
  };

  const handleNext = () => {
    if (!todasLasImagenes || todasLasImagenes.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % todasLasImagenes.length);
  };

  return (
    <>
      <Box
        style={{
          position: 'relative',
          cursor: 'pointer',
          display: 'inline-block',
          borderRadius: '4px',
          overflow: 'hidden',
          border: '1px solid #e0e0e0'
        }}
        onClick={handleOpen}
      >
        <Image
          src={imageError ? '/src/assets/logoRC.jpeg' : src}
          alt={alt}
          style={{
            width: size,
            height: size,
            objectFit: 'cover',
            display: 'block'
          }}
          onError={handleImageError}
        />
        <Box
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0,
            transition: 'opacity 0.2s',
            ':hover': {
              opacity: 1
            }
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0';
          }}
        >
          <IconZoomIn size={16} color="white" />
        </Box>
      </Box>

      <Modal
        opened={opened}
        onClose={close}
        title={`Imágenes del producto: ${numeroArticulo}`}
        size="lg"
        centered
      >
        <Box>
          <Stack gap="md">
            <Box style={{ position: 'relative' }}>
              <Text size="sm" fw={500} mb="xs">
                {`Imagen ${todasLasImagenes && todasLasImagenes.length > 0 ? currentIndex + 1 : 1}`}
              </Text>
              <Image
                src={
                  todasLasImagenes && todasLasImagenes.length > 0
                    ? todasLasImagenes[currentIndex]
                    : imageError
                      ? '/src/assets/logoRC.jpeg'
                      : src
                }
                alt={alt}
                style={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: '420px',
                  objectFit: 'contain'
                }}
                onError={handleImageError}
              />

              {todasLasImagenes && todasLasImagenes.length > 1 && (
                <>
                  <ActionIcon
                    variant="light"
                    color="gray"
                    onClick={handlePrev}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: 0,
                      transform: 'translateY(-50%)',
                    }}
                    aria-label="Anterior"
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
                      right: 0,
                      transform: 'translateY(-50%)',
                    }}
                    aria-label="Siguiente"
                  >
                    <IconChevronRight size={18} />
                  </ActionIcon>
                </>
              )}
            </Box>

            <Text size="sm" c="dimmed" mt="sm">
              Haz clic fuera del modal para cerrar
            </Text>
          </Stack>
        </Box>
      </Modal>
    </>
  );
}
