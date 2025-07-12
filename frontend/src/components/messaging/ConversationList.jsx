import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Loader2 } from 'lucide-react';

export default function ConversationList({ user, onSelectConversation, selectedConversationId }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setLoading(true);
      api.get('/messages/conversations')
        .then(res => {
          setConversations(res.data || []);
        })
        .catch(err => console.error("Failed to fetch conversations", err))
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (loading) {
    return <div className="p-4 text-center"><Loader2 className="animate-spin mx-auto text-cyan-400" /></div>;
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-900/50">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-xl font-bold text-white">Inbox</h2>
      </div>
      <div className="space-y-1">
        {conversations.length > 0 ? (
          conversations.map(convo => (
            <div
              key={convo.conversation_id}
              onClick={() => onSelectConversation(convo.conversation_id)}
              className={`p-4 flex items-center gap-4 cursor-pointer transition-colors ${selectedConversationId === convo.conversation_id ? 'bg-cyan-600/20 border-l-4 border-cyan-500' : 'hover:bg-gray-800/60'}`}
            >
              <img
                src={convo.other_participant.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(convo.other_participant.username)}&background=random`}
                alt={convo.other_participant.username}
                className="w-12 h-12 rounded-full"
              />
              <div className="flex-1 overflow-hidden">
                <p className="font-semibold text-white truncate">{convo.other_participant.username}</p>
                <p className="text-sm text-gray-400 truncate">{convo.last_message_content || 'No messages yet'}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="p-4 text-center text-gray-500">No conversations found.</p>
        )}
      </div>
    </div>
  );
}
