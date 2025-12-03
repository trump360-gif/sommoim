'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { chatApi, ChatMessage } from '@/lib/api/chat';
import { meetingsApi } from '@/lib/api/meetings';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const meetingId = params.id as string;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const { data: meeting, isLoading: meetingLoading } = useQuery({
    queryKey: ['meeting', meetingId],
    queryFn: () => meetingsApi.getOne(meetingId),
    enabled: isAuthenticated,
  });

  const { data: initialMessages, isLoading: messagesLoading } = useQuery({
    queryKey: ['chat-messages', meetingId],
    queryFn: () => chatApi.getMessages(meetingId),
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (initialMessages?.data) {
      setMessages(initialMessages.data);
    }
  }, [initialMessages]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000', {
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.emit('joinRoom', meetingId);

    socket.on('newMessage', (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on('messageDeleted', (messageId: string) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    });

    return () => {
      socket.emit('leaveRoom', meetingId);
      socket.disconnect();
    };
  }, [meetingId, isAuthenticated]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socketRef.current) return;

    socketRef.current.emit('sendMessage', { meetingId, content: newMessage });
    setNewMessage('');
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-gray-600">로그인이 필요합니다</p>
          <Button onClick={() => router.push('/auth/login')}>로그인</Button>
        </div>
      </div>
    );
  }

  if (meetingLoading || messagesLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      {/* 헤더 */}
      <div className="border-b bg-white px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-center gap-4">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="font-semibold">{meeting?.title}</h1>
            <p className="text-sm text-gray-500">채팅</p>
          </div>
        </div>
      </div>

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto bg-gray-50 px-4 py-4">
        <div className="mx-auto max-w-2xl space-y-4">
          {messages.map((msg) => {
            const isOwn = msg.user.id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] ${isOwn ? 'order-2' : ''}`}>
                  {!isOwn && (
                    <p className="mb-1 text-xs font-medium text-gray-600">{msg.user.nickname}</p>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      isOwn ? 'bg-primary-600 text-white' : 'bg-white text-gray-800'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                  </div>
                  <p className={`mt-1 text-xs text-gray-400 ${isOwn ? 'text-right' : ''}`}>
                    {new Date(msg.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 입력 영역 */}
      <form onSubmit={handleSend} className="border-t bg-white px-4 py-3">
        <div className="mx-auto flex max-w-2xl gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="메시지를 입력하세요"
            className="flex-1"
          />
          <Button type="submit" disabled={!newMessage.trim()}>
            전송
          </Button>
        </div>
      </form>
    </div>
  );
}
