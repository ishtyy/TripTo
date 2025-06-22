import React, { useState } from "react";
import api from "../services/api.js";
import Modal from "./Modal.jsx";

export default function SignInModal({ open, onClose, onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSignIn = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      const res = await api.post("/auth/login", { email: email.trim(), password: password.trim() });
      const { user, token } = res.data;
      onSuccess(user, token);
      onClose();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Unable to sign in.");
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="text-2xl font-bold text-cyan-300 mb-4 text-center">Sign In</h2>
      {errorMsg && <p className="text-red-400 bg-red-900/30 p-2 rounded-md text-sm mb-4 text-center">{errorMsg}</p>}
      <form onSubmit={handleSignIn} className="space-y-4">
        <div>
          <label className="block text-gray-300 mb-1 text-sm">Email</label>
          <input
            type="email"
            className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-500 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-gray-300 mb-1 text-sm">Password</label>
          <input
            type="password"
            className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-500 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="w-full px-4 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg shadow-cyan-600/20 hover:shadow-cyan-600/40"
        >
          Sign In
        </button>
      </form>
    </Modal>
  );
}