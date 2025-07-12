import React from 'react';
import { Link } from 'react-router-dom';

export default function TextLogo() {
  return (
    <Link to="/" className="text-2xl font-bold text-white tracking-wider">
      Trip<span className="text-cyan-400">To</span>
    </Link>
  );
}