import { NavLink, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav className="p-4 bg-blue-600 text-white flex justify-between" role="navigation" aria-label="Main Navigation">
      <h1 className="font-bold text-lg">RIDE BUDDY</h1>
      <div className="space-x-4">
        <NavLink to="/home" className={({ isActive }) => isActive ? "underline" : ""}>Home</NavLink>
        <NavLink to="/post" className={({ isActive }) => isActive ? "underline" : ""}>Post</NavLink>
        <NavLink to="/find" className={({ isActive }) => isActive ? "underline" : ""}>Find</NavLink>
        <NavLink to="/profile" className={({ isActive }) => isActive ? "underline" : ""}>Profile</NavLink>
        <button onClick={handleLogout} className="hover:underline">Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;