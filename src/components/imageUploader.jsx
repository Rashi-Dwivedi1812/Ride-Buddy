import { useState } from 'react';
import axios from 'axios';

const ImageUploader = ({ onUpload }) => {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImage(file);
    setPreview(URL.createObjectURL(file));
    setError('');
  };

  const handleUpload = async () => {
    if (!image) return setError('Please select an image');

    const formData = new FormData();
    formData.append('file', image);
    formData.append('upload_preset', 'post_ride_upload'); // your unsigned preset

    setUploading(true);
    try {
      const res = await axios.post(
        'https://api.cloudinary.com/v1_1/dqh2wytcb/image/upload',
        formData
      );
      onUpload(res.data.secure_url); // Send the URL to the parent
      setError('');
    } catch (err) {
      console.error('Upload failed:', err);
      setError('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mb-4">
      <input type="file" accept="image/*" onChange={handleFileChange} />
      {preview && <img src={preview} alt="Preview" className="h-24 my-2 rounded" />}
      {error && <p className="text-red-500">{error}</p>}
      <button
        onClick={handleUpload}
        disabled={!image || uploading}
        className="bg-blue-500 text-white px-4 py-2 rounded mt-2"
      >
        {uploading ? 'Uploading...' : 'Upload Screenshot'}
      </button>
    </div>
  );
};

export default ImageUploader;