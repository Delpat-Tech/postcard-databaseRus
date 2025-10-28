import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const token = useAuthStore((s) => s.token);
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Start Order", path: "/order" },
    ...(token ? [{ name: "Admin", path: "/admin" }] : []),
  ];

  const productTypes = [
    { name: 'Postcards', path: '/type/postcard' },
    { name: 'Letters', path: '/type/letter' },
    { name: 'Brochures', path: '/type/brochure' },
    { name: 'Bookmarks', path: '/type/bookmark' },
  ];

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-lg bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white shadow-md border-b border-white/10">
      <div className="container mx-auto flex justify-between items-center px-4 py-3">
        {/* Brand */}
        <Link
          to="/"
          className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent hover:opacity-90 transition-opacity"
        >
          Proof<span className="text-blue-200">&</span>Approve
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex space-x-4 items-center">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${isActive
                  ? "bg-white text-blue-700 shadow-sm"
                  : "bg-white/10 hover:bg-white/20  text-white"
                  }`}
              >
                {item.name}
              </Link>
            );
          })}

          {/* Product type quick links
          <div className="flex items-center space-x-2 ml-4">
            {productTypes.map((p) => (
              <Link key={p.path} to={p.path} className="px-3 py-1 text-sm rounded-md bg-white/10 hover:bg-white/20">
                {p.name}
              </Link>
            ))}
          </div> */}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-white/10 transition"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden bg-blue-800/95 backdrop-blur-xl border-t border-white/10">
          <div className="flex flex-col items-center space-y-3 py-4 ">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setOpen(false)}
                  className={`w-3/4 text-center px-4 py-2 rounded-full text-sm font-medium transition ${isActive
                    ? "bg-white text-blue-700 shadow-sm"
                    : "bg-white/10 hover:bg-white/20 text-white"
                    }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
