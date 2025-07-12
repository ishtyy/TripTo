import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ConversationList from '../components/messaging/ConversationList';
import ChatWindow from '../components/messaging/ChatWindow';

export default function MessagingPage({ user }) {
  // Get the conversationId from the URL, if it exists
  const { conversationId } = useParams();
  const [selectedConversationId, setSelectedConversationId] = useState(conversationId);
  const navigate = useNavigate();

  // Update the selected conversation when the URL changes
  useEffect(() => {
    setSelectedConversationId(conversationId);
  }, [conversationId]);

  // This function is called when a user clicks a conversation in the list
  const handleSelectConversation = (id) => {
    setSelectedConversationId(id);
    // Update the URL to reflect the selected conversation
    navigate(`/messages/${id}`);
  };

  return (
    <div className="flex h-[calc(100vh-theme(space.16))] animate-fade-in-up">
      {/* Left Column: Conversation List */}
      <div className="w-full md:w-1/3 border-r border-gray-800">
        <ConversationList
          user={user}
          onSelectConversation={handleSelectConversation}
          selectedConversationId={selectedConversationId}
        />
      </div>
      {/* Right Column: Chat Window */}
      <div className="hidden md:flex w-2/3 flex-col">
        <ChatWindow
          user={user}
          selectedConversationId={selectedConversationId}
        />
      </div>
    </div>
  );
}
