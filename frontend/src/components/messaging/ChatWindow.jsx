// src/components/ChatWindow.jsx
import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { Loader2, Send } from 'lucide-react';

export default function ChatWindow({ user, selectedConversationId }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!selectedConversationId) return;
    setLoading(true);
    api.get(`/messages/${selectedConversationId}`)
      .then(res => setMessages(res.data || []))
      .catch(err => console.error('Failed to fetch messages', err))
      .finally(() => setLoading(false));
  }, [selectedConversationId]);

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async e => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversationId) return;

    const tempId = Date.now();
    const content = newMessage;
    setNewMessage('');
    setMessages(prev => [
      ...prev,
      { message_id: tempId, sender_id: user.user_id, content, sent_at: new Date().toISOString() }
    ]);

    try {
      const { data: saved } = await api.post(
        `/messages/${selectedConversationId}`,
        { content }
      );
      setMessages(prev =>
        prev.map(msg => msg.message_id === tempId ? saved : msg)
      );
    } catch {
      setMessages(prev => prev.filter(msg => msg.message_id !== tempId));
      setNewMessage(content);
    }
  };

  if (!selectedConversationId) {
    return (
      <div className="h-full flex items-center justify-center text-blue-300">
        <p>Select a conversation to start chatting.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Messages pane */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {messages.map(msg => (
          <div
            key={msg.message_id}
            className={`flex items-end gap-2 ${
              msg.sender_id === user.user_id ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-md px-4 py-2 rounded-2xl shadow-sm ${
                msg.sender_id === user.user_id
                  ? 'bg-blue-800 text-white rounded-br-none'
                  : 'bg-blue-700 text-blue-100 rounded-bl-none'
              }`}
            >
              <p className="break-words">{msg.content}</p>
              <p className="text-[10px] opacity-50 mt-1 text-right">
                {new Date(msg.sent_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="p-4 border-t border-blue-700 bg-black/30 backdrop-blur-sm">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="
              flex-1 px-4 py-2 rounded-lg
              bg-blue-900/70 text-blue-100
              border border-blue-700
              focus:outline-none focus:ring-2 focus:ring-blue-500
            "
          />
          <button
            type="submit"
            className="
              p-2 bg-blue-600 hover:bg-blue-500
              text-white rounded-lg
              transition-colors
            "
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
