import { useState } from 'react';
import axios from 'axios';

const ImageUploader = ({ onUpload, uploaded }) => {
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
    formData.append('upload_preset', 'post_ride_upload');

    setUploading(true);
    try {
      const res = await axios.post(
        'https://api.cloudinary.com/v1_1/dqh2wytcb/image/upload',
        formData
      );
      onUpload(res.data.secure_url);
      setError('');
    } catch (err) {
      console.error('Upload failed:', err);
      setError('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mb-6">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="mb-2 text-sm text-gray-300 file:bg-cyan-600 file:text-white file:rounded-md file:px-4 file:py-1 hover:file:bg-cyan-700 transition"
      />

      {preview && (
        <img
          src={preview}
          alt="Preview"
          className="h-28 rounded-lg shadow-md mb-3 border border-cyan-500"
        />
      )}

      {error && <p className="text-red-500 mb-2">{error}</p>}

      <button
        onClick={handleUpload}
        disabled={!image || uploading || uploaded}
        className={`group relative w-full font-semibold py-2 rounded-xl transition-all duration-300
          ${uploaded
            ? 'bg-emerald-600 cursor-not-allowed text-white'
            : 'bg-cyan-600 hover:bg-cyan-700 text-white'}
        `}
      >
        {uploaded ? 'Uploaded ✅' : uploading ? 'Uploading...' : 'Upload Screenshot'}
        {!uploaded && !uploading && (
          <span className="absolute inset-0 rounded-xl ring-2 ring-cyan-400 opacity-0 group-hover:opacity-100 blur-md animate-pulse transition duration-300" />
        )}
      </button>
    </div>
  );
};

export default ImageUploader;