import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { Mail, Phone, MapPin } from 'lucide-react';

const FeedbackPage = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error('Please fill out all fields!');
      return;
    }

    // Submit logic here (API call etc.)
    toast.success('Feedback submitted successfully!');
    setForm({ name: '', email: '', message: '' });
  };

  return (
    <div className="dark min-h-screen bg-[#0f0f0f] text-white flex flex-col md:flex-row items-center justify-center gap-12 relative px-4 py-16">
      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff0d_1px,transparent_1px)] [background-size:20px_20px] z-0" />
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-700 opacity-10 blur-2xl z-0" />

      {/* Feedback Form Card */}
      <form
        onSubmit={handleSubmit}
        className="group relative z-10 w-full max-w-xl bg-white/10 backdrop-blur-md p-10 rounded-2xl shadow-2xl border border-white/20
                      hover:shadow-[0_0_30px_#8b5cf6] hover:scale-[1.02] hover:border-purple-400 transition-all duration-300"
      >
        <h2 className="text-3xl font-bold text-center mb-6 text-white">
          We Value Your Feedback 💬
        </h2>

        <input
          name="name"
          placeholder="Your Name"
          className="w-full px-4 py-2 bg-white/10 border border-gray-300 text-white rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={form.name}
          onChange={handleChange}
        />
        <input
          name="email"
          type="email"
          placeholder="you@example.com"
          className="w-full px-4 py-2 bg-white/10 border border-gray-300 text-white rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={form.email}
          onChange={handleChange}
        />
        <textarea
          name="message"
          rows="4"
          placeholder="Your message..."
          className="w-full px-4 py-2 bg-white/10 border border-gray-300 text-white rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={form.message}
          onChange={handleChange}
        />

        <button
          type="submit"
          className="group relative w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 mt-4 rounded-xl transition-all duration-300"
        >
          Submit Feedback
          <span className="absolute inset-0 rounded-xl ring-2 ring-blue-400 opacity-0 group-hover:opacity-100 blur-md animate-pulse transition duration-300" />
        </button>
      </form>

      {/* Enhanced Contact Cards */}
<div className="w-full lg:w-1/4 pt-8 lg:pt-20 flex flex-col gap-6 z-10">
  {[{
    icon: <Mail size={28} className="text-green-400" />,
    label: "Email",
    value: "rashidwivedi1812@gmail.com",
  }, {
    icon: <Phone size={28} className="text-green-400" />,
    label: "Phone",
    value: "+91 8287800041",
  }, {
    icon: <MapPin size={28} className="text-green-400" />,
    label: "Location",
    value: "JIIT, Noida",
  }].map(({ icon, label, value }, index) => (
    <div
      key={index}
      className="flex items-center gap-4 p-5 bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl shadow-xl hover:shadow-[0_0_25px_#22c55e55] transition-all duration-300 hover:scale-105 group"
    >
      <div className="p-2 rounded-full bg-green-400/10 group-hover:bg-green-400/20 transition">
        {icon}
      </div>
      <div>
        <p className="font-semibold text-white text-lg">{label}</p>
        <p className="text-sm text-gray-300 break-all">{value}</p>
      </div>
    </div>
  ))}
</div>
    </div>
  );
};

export default FeedbackPage;