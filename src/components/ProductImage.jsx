import { useState } from 'react';
import { productPhotos } from '../data/productPhotos.js';

export default function ProductImage({ product, className = '', loading = 'lazy' }) {
  const [failed, setFailed] = useState(false);
  const photo = productPhotos[product.slug];
  if (!photo || failed) {
    return <span className={`product-image-placeholder ${className}`}>Ảnh đang cập nhật</span>;
  }
  return <img className={`product-photo ${className}`} src={photo.src} alt={`${product.name} — ảnh tham khảo ${product.species}`} width="900" height="900" loading={loading} decoding="async" onError={() => setFailed(true)} />;
}
