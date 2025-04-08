import React, { useState, useEffect, useRef } from 'react';
import { subscribeToGameMessages, sendGameMessage } from '../../services/chatService';
import { auth } from '../../config/firebase';

const GameChat = ({ gameId, gameName }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  
  useEffect(() => {
    const unsubscribe = subscribeToGameMessages(gameId, (updatedMessages) => {
      setMessages(updatedMessages);
      setLoading(false);
    });
    
    return () => {
      unsubscribe();
    };
  }, [gameId]);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  const handleSend = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    try {
      await sendGameMessage(gameId, newMessage);
      setNewMessage('');
    } catch (error) {
      setError('Error sending message: ' + error.message);
      console.error(error);
    }
  };
  
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  if (loading) return <div className="loading-chat">Loading chat...</div>;
  
  return (
    <div className="game-chat">
      <div className="chat-header">
        <h3>Game Chat: {gameName}</h3>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet. Be the first to say hello!</p>
          </div>
        ) : (
          <div className="messages-list">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`message-item ${message.senderId === auth.currentUser.uid ? 'sent' : 'received'}`}
              >
                <div className="message-content">
                  <div className="message-header">
                    <span className="sender-name">{message.senderName}</span>
                    <span className="message-time">{formatTime(message.createdAt)}</span>
                  </div>
                  <p className="message-text">{message.text}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      <form className="message-form" onSubmit={handleSend}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="message-input"
        />
        <button type="submit" className="send-button">Send</button>
      </form>
    </div>
  );
};

export default GameChat;