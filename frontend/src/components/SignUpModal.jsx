import React, { useState } from "react";
import api from "../services/api.js";
import Modal from "./Modal.jsx";

export default function SignUpModal({ open, onClose, onSuccess }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSignUp = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    if (!username.trim() || !email.trim() || !password) {
        setErrorMsg("All fields are required.");
        return;
    }
    try {
      const res = await api.post("/auth/register", { username: username.trim(), email: email.trim(), password });
      onSuccess(res.data.user, res.data.token);
      onClose();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Registration failed.");
    }
  };

  React.useEffect(() => {
    if (open) { setUsername(""); setEmail(""); setPassword(""); setErrorMsg(""); }
  }, [open]);

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="text-2xl font-bold text-purple-400 mb-4 text-center">Create Account</h2>
      {errorMsg && <p className="text-red-400 bg-red-900/30 p-2 rounded-md text-sm mb-4 text-center">{errorMsg}</p>}
      <form onSubmit={handleSignUp} className="space-y-4">
        <div>
          <label className="block text-gray-300 mb-1 text-sm">Username</label>
          <input id="signup-username" type="text"
            className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-500 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
            value={username} onChange={(e) => setUsername(e.target.value)} required autoComplete="username" />
        </div>
        <div>
          <label className="block text-gray-300 mb-1 text-sm">Email</label>
          <input id="signup-email" type="email"
            className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-500 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
            value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </div>
        <div>
          <label className="block text-gray-300 mb-1 text-sm">Password</label>
          <input id="signup-password" type="password"
            className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-500 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
            value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
        </div>
        <button type="submit"
          className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg shadow-purple-600/20 hover:shadow-purple-600/40"
        >
          Sign Up
        </button>
      </form>
    </Modal>
  );
}