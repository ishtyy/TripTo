// frontend/src/components/SignUpModal.jsx
import React, { useState } from "react";
import api from "../../services/api.js";
import Modal from "../common/Modal.jsx"; // Assuming Modal.jsx is in the same directory

export default function SignUpModal({ open, onClose, onSuccess }) {
  const [username, setUsername] = useState(""); // Add state for username
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSignUp(e) {
    e.preventDefault();
    setErrorMsg("");

    if (!username.trim()) { // Basic client-side validation
        setErrorMsg("Username is required.");
        return;
    }
    if (!email.trim()) {
        setErrorMsg("Email is required.");
        return;
    }
    if (!password) { // Password can have leading/trailing spaces if desired, so no trim by default
        setErrorMsg("Password is required.");
        return;
    }


    try {
      // Ensure all three fields are sent to the backend
      const res = await api.post("/auth/register", {
        username: username.trim(), // Send username
        email: email.trim(),
        password: password, // Send password as is (backend can trim if needed, bcrypt handles spaces)
      });
      // Assuming onSuccess expects (user, token)
      // The backend /auth/register currently returns { user, token }
      onSuccess(res.data.user, res.data.token); 
      onClose();
    } catch (err) {
      console.error("Sign Up Error:", err.response?.data || err.message);
      const msg = err.response?.data?.error || "Registration failed. Please try again.";
      setErrorMsg(msg);
    }
  }

  // Reset fields when modal is closed or opened
  React.useEffect(() => {
    if (open) {
        setUsername("");
        setEmail("");
        setPassword("");
        setErrorMsg("");
    }
  }, [open]);

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="text-2xl font-heading text-sky-400 mb-4">Sign Up</h2>
      {errorMsg && (
        <p className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded-md text-sm mb-3">
            {errorMsg}
        </p>
      )}
      <form onSubmit={handleSignUp} className="space-y-4">
        <div>
          <label htmlFor="signup-username" className="block text-sm font-medium text-gray-200 mb-1">Username</label>
          <input
            id="signup-username"
            type="text"
            className="w-full px-3 py-2 rounded bg-gray-900 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-400 border border-gray-700"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
          />
        </div>
        <div>
          <label htmlFor="signup-email" className="block text-sm font-medium text-gray-200 mb-1">Email</label>
          <input
            id="signup-email"
            type="email"
            className="w-full px-3 py-2 rounded bg-gray-900 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-400 border border-gray-700"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div>
          <label htmlFor="signup-password" className="block text-sm font-medium text-gray-200 mb-1">Password</label>
          <input
            id="signup-password"
            type="password"
            className="w-full px-3 py-2 rounded bg-gray-900 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-400 border border-gray-700"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
        </div>
        <button
          type="submit"
          className="w-full px-4 py-2.5 bg-sunset hover:bg-sunset/90 text-white rounded-md font-semibold transition-colors"
        >
          Create Account
        </button>
      </form>
    </Modal>
  );
}
