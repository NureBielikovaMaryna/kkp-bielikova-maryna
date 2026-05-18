// src/components/ImageUploader.jsx
import { useState } from 'react';

function ImageUploader({ currentPhoto, onImageUpload }) {
  const [preview, setPreview] = useState(currentPhoto);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Перевірка розміру (наприклад, до 2МБ)
      if (file.size > 2 * 1024 * 1024) {
        alert("Файл занадто великий!");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setPreview(base64String); // Показуємо прев'ю
        onImageUpload(base64String); // Передаємо в батьківський компонент
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={previewCircle}>
        {preview ? (
          <img src={preview} alt="Preview" style={imgStyle} />
        ) : (
          <span style={{ fontSize: '30px' }}>👤</span>
        )}
      </div>
      
      <label style={uploadLabel}>
        <span>📁 Обрати фото</span>
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleFileChange} 
          style={{ display: 'none' }} 
        />
      </label>
      <small style={{ color: '#888', marginTop: '5px' }}>Макс. розмір: 2MB</small>
    </div>
  );
}

const containerStyle = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' };
const previewCircle = { width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#eee', overflow: 'hidden', border: '2px solid #007bff', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const imgStyle = { width: '100%', height: '100%', objectFit: 'cover' };
const uploadLabel = { backgroundColor: '#f0f7ff', color: '#007bff', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', border: '1px solid #007bff' };

export default ImageUploader;