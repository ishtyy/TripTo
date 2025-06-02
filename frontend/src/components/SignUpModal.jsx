// frontend/src/components/SignUpModal.jsx

import React, { useState } from "react";
import api from "../services/api.js";
import Modal from "./Modal.jsx";

export default function SignUpModal({ open, onClose, onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSignUp(e) {
    e.preventDefault();
    setErrorMsg("");
    try {
      const res = await api.post("/auth/register", {
        email: email.trim(),
        password: password.trim(),
      });
      const { user, token } = res.data;
      localStorage.setItem("tripto_user", JSON.stringify(user));
      localStorage.setItem("tripto_token", token);
      onSuccess(user, token);
      onClose();
    } catch (err) {
      console.error("Sign Up Error:", err);
      const msg = err.response?.data?.error || "Registration failed.";
      setErrorMsg(msg);
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="text-2xl font-heading text-sky-400 mb-4">Sign Up</h2>
      {errorMsg && (
        <p className="text-red-500 mb-2 text-sm">{errorMsg}</p>
      )}
      <form onSubmit={handleSignUp} className="space-y-4">
        <div>
          <label className="block text-gray-200 mb-1">Email</label>
          <input
            type="email"
            className="w-full px-3 py-2 rounded bg-gray-900 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-gray-200 mb-1">Password</label>
          <input
            type="password"
            className="w-full px-3 py-2 rounded bg-gray-900 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="w-full px-4 py-2 bg-sunset hover:bg-sunset/90 text-white rounded"
        >
          Sign Up
        </button>
      </form>
    </Modal>
  );
}
