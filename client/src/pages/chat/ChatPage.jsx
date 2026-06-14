import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PageHeader } from '../../components/ui/page-header.jsx';
import { Card } from '../../components/ui/card.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Badge } from '../../components/ui/badge.jsx';
import { 
  Hash, Send, Paperclip, Users, 
  MessageSquare, Loader2, FileText, Image as ImageIcon, Download 
} from 'lucide-react';
import { 
  useGetChannelsQuery, 
  useGetMessagesQuery, 
  useSendMessageMutation 
} from '../../services/chatApi.js';
import { useGetPresenceListQuery } from '../../services/adminApi.js';
import useAuth from '../../hooks/useAuth.js';
import AttachmentPreviewModal from '../../components/common/AttachmentPreviewModal.jsx';
import { toast } from 'sonner';

export default function ChatPage() {
  const { user, accessToken } = useAuth();
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);

  // States
  const [activeChannelId, setActiveChannelId] = useState(null);
  const [typedMessage, setTypedMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [attachments, setAttachments] = useState([]);
  
  // Preview modal states
  const [previewFile, setPreviewFile] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // RTK Queries
  const { data: channelsData, isLoading: isChannelsLoading } = useGetChannelsQuery();
  const { data: presenceData } = useGetPresenceListQuery(undefined, {
    pollingInterval: 10000 // Poll presence list every 10s
  });
  
  const channels = useMemo(() => channelsData?.data || [], [channelsData]);
  const presenceList = presenceData?.data || [];

  // Get messages of active channel
  const { data: messagesData, isLoading: isMessagesLoading, refetch: refetchMessages } = useGetMessagesQuery(
    activeChannelId,
    { skip: !activeChannelId, pollingInterval: 5000 } // Poll messages every 5s for fallback sync
  );
  
  const messages = useMemo(() => messagesData?.data || [], [messagesData]);

  const [sendMessageApi, { isLoading: isSending }] = useSendMessageMutation();

  // Set first channel as active by default
  useEffect(() => {
    if (channels.length > 0 && !activeChannelId) {
      const general = channels.find(c => c.name === 'general');
      setActiveChannelId(general ? (general.id || general._id) : (channels[0].id || channels[0]._id));
    }
  }, [channels, activeChannelId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const activeChannel = channels.find(c => (c.id || c._id) === activeChannelId);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!typedMessage.trim() && attachments.length === 0) return;

    try {
      await sendMessageApi({
        channelId: activeChannelId,
        content: typedMessage,
        attachments: attachments.map(a => ({
          name: a.fileName,
          url: a.url,
          publicId: a.publicId,
          size: a.size
        }))
      }).unwrap();
      
      setTypedMessage('');
      setAttachments([]);
      refetchMessages();
    } catch (err) {
      toast.error('Failed to send message');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File exceeds 10MB limit.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', 'chat');
    formData.append('entityId', activeChannelId);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: formData
      });

      const data = await response.json();
      if (response.ok) {
        setAttachments(prev => [...prev, data]);
        toast.success(`${file.name} uploaded successfully`);
      } else {
        toast.error(data.message || "Failed to upload file");
      }
    } catch (err) {
      toast.error("Error uploading file");
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const openPreview = (att) => {
    setPreviewFile({
      name: att.name || att.fileName,
      url: att.url || att.cloudinaryUrl,
      size: att.size,
      mimeType: att.name?.endsWith('.pdf') ? 'application/pdf' : 'image/png' // estimate
    });
    setPreviewOpen(true);
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col space-y-4">
      <PageHeader
        title="Colleague Discussion Rooms"
        subtitle="Collaborate on active milestones, task feedback, and chat room updates"
      />

      <div className="flex-1 flex gap-4 overflow-hidden min-h-0">
        
        {/* Panel 1: Channels sidebar (Left) */}
        <Card className="w-64 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 backdrop-blur-sm flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
              <MessageSquare className="h-4.5 w-4.5 text-blue-500" />
              <span>Channels & Rooms</span>
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {isChannelsLoading ? (
              <div className="text-center py-6 text-xs text-slate-400">Loading rooms...</div>
            ) : channels.map((c) => {
              const cid = c.id || c._id;
              const isActive = cid === activeChannelId;
              return (
                <button
                  key={cid}
                  onClick={() => {
                    setActiveChannelId(cid);
                    setAttachments([]);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Hash className="h-4 w-4 shrink-0" />
                  <span className="truncate">{c.name}</span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Panel 2: Message stream & input (Center) */}
        <Card className="flex-1 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 backdrop-blur-sm flex flex-col min-w-0">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <Hash className="h-5 w-5 text-blue-500 shrink-0" />
              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">
                {activeChannel?.name || 'Channel'}
              </h4>
            </div>
          </div>

          {/* Messages area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
            {isMessagesLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                <span>Loading channel messages...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs">
                <span>Start the conversation. Send a message to this channel!</span>
              </div>
            ) : (
              messages.map((msg) => {
                const isOwn = msg.sender?.email === user.email;
                return (
                  <div key={msg.id || msg._id} className={`flex items-start gap-3 max-w-[80%] ${isOwn ? 'ml-auto flex-row-reverse' : ''}`}>
                    {msg.sender?.avatar ? (
                      <img 
                        src={msg.sender.avatar} 
                        alt={msg.sender.firstName} 
                        className="h-8 w-8 rounded-full object-cover border"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
                        {msg.sender?.firstName?.[0]}{msg.sender?.lastName?.[0]}
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className={`flex items-center gap-2 text-[10px] text-slate-400 ${isOwn ? 'justify-end' : ''}`}>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {msg.sender?.firstName} {msg.sender?.lastName}
                        </span>
                        <span className="uppercase tracking-wide">({msg.sender?.role})</span>
                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      <div className={`p-3.5 rounded-2xl text-xs ${
                        isOwn 
                          ? 'bg-blue-600 text-white rounded-tr-none' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border dark:border-slate-800/80'
                      }`}>
                        {msg.content}

                        {/* Attachments */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-3 space-y-2 border-t pt-2 border-slate-200/50 dark:border-slate-700/50">
                            {msg.attachments.map((att, idx) => (
                              <div key={idx} className="flex items-center justify-between gap-4 bg-black/10 dark:bg-black/20 p-2 rounded-lg">
                                <div className="flex items-center gap-2 min-w-0">
                                  <FileText className="h-4 w-4 shrink-0" />
                                  <span className="text-[11px] truncate font-medium max-w-[150px]">{att.name}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => openPreview(att)}
                                    className="p-1 hover:bg-white/20 rounded text-[10px] font-bold"
                                  >
                                    Preview
                                  </button>
                                  <a
                                    href={att.url}
                                    download
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 hover:bg-white/20 rounded"
                                  >
                                    <Download className="h-3.5 w-3.5" />
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Attachments pending container */}
          {attachments.length > 0 && (
            <div className="px-6 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex flex-wrap gap-2">
              {attachments.map((att, idx) => (
                <Badge key={idx} variant="secondary" className="gap-2 text-[10px] pl-2.5">
                  <ImageIcon className="h-3.5 w-3.5" />
                  <span>{att.fileName}</span>
                  <button 
                    onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Message form input */}
          <form onSubmit={handleSend} className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileUpload}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={triggerFileInput}
              disabled={isUploading}
              className="h-10 w-10 shrink-0"
            >
              {isUploading ? (
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
              ) : (
                <Paperclip className="h-4.5 w-4.5 text-slate-500" />
              )}
            </Button>

            <textarea
              id="chat-message-input"
              value={typedMessage}
              onChange={(e) => setTypedMessage(e.target.value)}
              placeholder="Type your message here..."
              disabled={isSending}
              className="flex-1 h-10 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2.5 text-xs focus:outline-none resize-none"
            />

            <Button 
              type="submit" 
              size="icon"
              disabled={isSending || (!typedMessage.trim() && attachments.length === 0)}
              className="h-10 w-10 bg-blue-600 hover:bg-blue-700 shrink-0 text-white"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </Card>

        {/* Panel 3: Member list (Right) */}
        <Card className="w-56 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 backdrop-blur-sm flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
              <Users className="h-4.5 w-4.5 text-blue-500" />
              <span>Room Members</span>
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {activeChannel?.members?.map((m) => {
              const mid = m.id || m._id;
              // Check online status from presence list
              const isUserOnline = presenceList.some(online => online.user?._id === mid || online.user?.id === mid || online.id === mid);
              return (
                <div key={mid} className="flex items-center gap-2">
                  <div className="relative">
                    {m.avatar ? (
                      <img src={m.avatar} alt={m.firstName} className="h-7 w-7 rounded-full object-cover" />
                    ) : (
                      <div className="h-7 w-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-[10px] text-slate-600 dark:text-slate-300">
                        {m.firstName?.[0]}{m.lastName?.[0]}
                      </div>
                    )}
                    <span className={`absolute bottom-0 right-0 h-2 w-2 rounded-full border border-white dark:border-slate-900 ${
                      isUserOnline ? 'bg-emerald-500' : 'bg-slate-400'
                    }`} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                      {m.firstName} {m.lastName}
                    </div>
                    <div className="text-[9px] uppercase tracking-wide text-slate-400 font-medium truncate">
                      {m.role}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

      </div>

      <AttachmentPreviewModal 
        file={previewFile}
        isOpen={previewOpen}
        onClose={() => {
          setPreviewOpen(false);
          setPreviewFile(null);
        }}
      />
    </div>
  );
}
