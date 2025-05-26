import React, { useState } from 'react';
import axios from '../api/axios';

const ImageUploader = ({ onUpload }) => {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
        setError('Only JPEG, PNG, or GIF images are allowed');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Image size must be less than 5MB');
        return;
      }
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!image) {
      setError('Please select an image');
      return;
    }
    const formData = new FormData();
    formData.append('image', image);
    try {
      const res = await axios.post('/upload', formData);
      onUpload(res.data.imageUrl);
      setError('');
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to upload image');
    }
  };

  return (
    <div className="mb-4">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="border rounded p-2 w-full"
      />
      {preview && <img src={preview} alt="Preview" className="h-24 my-2 rounded" />}
      {error && <p className="text-red-500">{error}</p>}
      <button
        onClick={handleUpload}
        className="bg-blue-500 text-white px-4 py-2 rounded mt-2"
      >
        Upload Screenshot
      </button>
    </div>
  );
};

export default ImageUploader;