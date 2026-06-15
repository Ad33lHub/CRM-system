import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Card } from '../../components/ui/card.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Badge } from '../../components/ui/badge.jsx';
import {
  Hash, Send, Paperclip, Users,
  MessageSquare, Loader2, FileText, Image as ImageIcon, Download,
  Globe, ChevronDown, Check, X, Lock, Pin, Trash2,
  Search, Plus, Shield
} from 'lucide-react';
import {
  useGetChannelsQuery,
  useGetMessagesQuery,
  useSendMessageMutation,
  useDeleteMessageMutation,
  usePinMessageMutation,
  useGetChannelMembersQuery,
  useCreateChannelMutation,
} from '../../services/chatApi.js';
import { useGetPresenceListQuery } from '../../services/adminApi.js';
import useAuth from '../../hooks/useAuth.js';
import AttachmentPreviewModal from '../../components/common/AttachmentPreviewModal.jsx';
import { toast } from 'sonner';

/* ── Role constants ─────────────────────────────────────────────── */
const ADMIN_ROLES = ['super_admin', 'admin'];
const ALL_ROLES = ['super_admin', 'admin', 'manager', 'developer', 'designer', 'qa_engineer'];
const ROLE_LABELS = {
  super_admin: 'Super Admins',
  admin: 'Admins',
  manager: 'Managers',
  developer: 'Developers',
  designer: 'Designers',
  qa_engineer: 'QA Engineers',
};

export default function ChatPage() {
  const { user, accessToken, role: userRole } = useAuth();
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);
  const recipientDropdownRef = useRef(null);

  /* ── State ──────────────────────────────────────────────────── */
  const [activeChannelId, setActiveChannelId] = useState(null);
  const [typedMessage, setTypedMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [recipient, setRecipient] = useState('everyone');
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false);
  const [recipientSearch, setRecipientSearch] = useState('');
  const [previewFile, setPreviewFile] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');

  /* ── RTK Queries ────────────────────────────────────────────── */
  const { data: channelsData, isLoading: isChannelsLoading } = useGetChannelsQuery();
  const { data: presenceData } = useGetPresenceListQuery(undefined, { pollingInterval: 10000 });

  const channels = useMemo(() => channelsData?.data || [], [channelsData]);
  const presenceList = useMemo(() => presenceData?.data || [], [presenceData]);

  const { data: messagesData, isLoading: isMessagesLoading, refetch: refetchMessages } = useGetMessagesQuery(
    activeChannelId,
    { skip: !activeChannelId, pollingInterval: 5000 }
  );
  const messages = useMemo(() => messagesData?.data || [], [messagesData]);

  const { data: membersData } = useGetChannelMembersQuery(
    activeChannelId,
    { skip: !activeChannelId, pollingInterval: 15000 }
  );
  const channelMembers = useMemo(() => membersData?.data || [], [membersData]);

  const [sendMessageApi, { isLoading: isSending }] = useSendMessageMutation();
  const [deleteMessageApi] = useDeleteMessageMutation();
  const [pinMessageApi] = usePinMessageMutation();
  const [createChannelApi] = useCreateChannelMutation();

  /* ── Derived ────────────────────────────────────────────────── */
  const activeChannel = channels.find(c => (c.id || c._id) === activeChannelId);
  const currentUserId = user?.id || user?._id;

  const isUserOnline = useCallback((memberId) => {
    return presenceList.some(p =>
      p.user?._id === memberId || p.user?.id === memberId || p.id === memberId || p._id === memberId
    );
  }, [presenceList]);

  // Sort members: online first, then alphabetical
  const sortedMembers = useMemo(() => {
    return [...channelMembers].sort((a, b) => {
      const aId = a.id || a._id;
      const bId = b.id || b._id;
      const aOnline = isUserOnline(aId) ? 0 : 1;
      const bOnline = isUserOnline(bId) ? 0 : 1;
      if (aOnline !== bOnline) return aOnline - bOnline;
      return (a.firstName || '').localeCompare(b.firstName || '');
    });
  }, [channelMembers, isUserOnline]);

  const memberCount = channelMembers.length;
  const onlineCount = useMemo(
    () => channelMembers.filter((m) => isUserOnline(m.id || m._id)).length,
    [channelMembers, isUserOnline]
  );

  // Role groups available based on user's role
  const availableRoleGroups = useMemo(() => {
    if (ADMIN_ROLES.includes(userRole)) {
      return ALL_ROLES.filter(r => r !== userRole);
    }
    // Manager and below: no role groups
    return [];
  }, [userRole]);

  // Recipient list members (excluding self)
  const recipientMembers = useMemo(() => {
    return sortedMembers.filter(m => {
      const mid = m.id || m._id;
      return mid !== currentUserId;
    });
  }, [sortedMembers, currentUserId]);

  // Filtered members for dropdown search
  const filteredRecipientMembers = useMemo(() => {
    if (!recipientSearch.trim()) return recipientMembers;
    const q = recipientSearch.toLowerCase();
    return recipientMembers.filter(m =>
      `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) ||
      m.role?.toLowerCase().includes(q)
    );
  }, [recipientMembers, recipientSearch]);

  const showSearch = recipientMembers.length > 10;

  /* ── Effects ────────────────────────────────────────────────── */
  // Set first channel as active by default
  useEffect(() => {
    if (channels.length > 0 && !activeChannelId) {
      const general = channels.find(c => c.name === 'general');
      setActiveChannelId(general ? (general.id || general._id) : (channels[0].id || channels[0]._id));
    }
  }, [channels, activeChannelId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Close recipient dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (recipientDropdownRef.current && !recipientDropdownRef.current.contains(e.target)) {
        setShowRecipientDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* ── Recipient display ──────────────────────────────────────── */
  const getRecipientLabel = useCallback(() => {
    if (recipient === 'everyone') return 'Everyone';
    if (recipient.startsWith('role:')) {
      const roleName = recipient.replace('role:', '');
      return ROLE_LABELS[roleName] || roleName;
    }
    const member = channelMembers.find(m => (m.id || m._id) === recipient);
    if (member) return `${member.firstName} ${member.lastName}`.trim();
    return 'Everyone';
  }, [recipient, channelMembers]);

  const getRecipientIcon = () => {
    if (recipient === 'everyone') return Globe;
    if (recipient.startsWith('role:')) return Shield;
    return Lock;
  };
  const RecipientIcon = getRecipientIcon();

  /* ── Handlers ───────────────────────────────────────────────── */
  const handleSend = async (e) => {
    e.preventDefault();
    if (!typedMessage.trim() && attachments.length === 0) return;

    try {
      await sendMessageApi({
        channelId: activeChannelId,
        content: typedMessage,
        recipient,
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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File exceeds 10MB limit.');
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
        headers: { 'Authorization': `Bearer ${accessToken}` },
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        setAttachments(prev => [...prev, data]);
        toast.success(`${file.name} uploaded`);
      } else {
        toast.error(data.message || 'Upload failed');
      }
    } catch {
      toast.error('Error uploading file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (msgId) => {
    try {
      await deleteMessageApi(msgId).unwrap();
      toast.success('Message deleted');
      refetchMessages();
    } catch {
      toast.error('Failed to delete message');
    }
  };

  const handlePin = async (msgId) => {
    try {
      await pinMessageApi(msgId).unwrap();
      refetchMessages();
    } catch {
      toast.error('Failed to pin/unpin message');
    }
  };

  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) return;
    try {
      await createChannelApi({ name: newChannelName.trim() }).unwrap();
      toast.success('Channel created');
      setNewChannelName('');
      setShowCreateChannel(false);
    } catch {
      toast.error('Failed to create channel');
    }
  };

  const selectRecipient = (id) => {
    setRecipient(id);
    setShowRecipientDropdown(false);
    setRecipientSearch('');
  };

  const openPreview = (att) => {
    setPreviewFile({
      name: att.name || att.fileName,
      url: att.url || att.cloudinaryUrl,
      size: att.size,
      mimeType: att.name?.endsWith('.pdf') ? 'application/pdf' : 'image/png'
    });
    setPreviewOpen(true);
  };

  /* ── Message grouping ───────────────────────────────────────── */
  const groupedMessages = useMemo(() => {
    return messages.map((msg, idx) => {
      const prevMsg = idx > 0 ? messages[idx - 1] : null;
      const senderIdCur = msg.sender?.id || msg.sender?._id || msg.sender;
      const senderIdPrev = prevMsg ? (prevMsg.sender?.id || prevMsg.sender?._id || prevMsg.sender) : null;
      const isFirstInGroup = !prevMsg || senderIdCur !== senderIdPrev;
      return { ...msg, isFirstInGroup };
    });
  }, [messages]);

  /* ── Can-do checks ──────────────────────────────────────────── */
  const canDeleteMessage = (msg) => {
    if (ADMIN_ROLES.includes(userRole)) return true;
    const senderId = msg.sender?.id || msg.sender?._id;
    return senderId === currentUserId;
  };
  const canPinMessage = () => ADMIN_ROLES.includes(userRole);
  const canCreateChannel = () => ADMIN_ROLES.includes(userRole);

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div className="crm-chat-root">
      <div className="crm-chat-columns">

        {/* ═══ LEFT: Channels ═══ */}
        <div className="crm-chat-col-left">
          <Card className="crm-chat-card">
            <div className="crm-chat-panel-hdr">
              <h3 className="crm-chat-panel-title">
                <MessageSquare size={16} className="text-blue-500" />
                <span>Channels & Rooms</span>
              </h3>
              {canCreateChannel() && (
                <button
                  onClick={() => setShowCreateChannel(!showCreateChannel)}
                  className="crm-chat-icon-btn"
                  title="Create channel"
                >
                  <Plus size={14} />
                </button>
              )}
            </div>

            {showCreateChannel && (
              <div className="crm-chat-create-ch">
                <input
                  value={newChannelName}
                  onChange={e => setNewChannelName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreateChannel()}
                  placeholder="Channel name…"
                  className="crm-chat-create-input"
                />
                <button onClick={handleCreateChannel} className="crm-chat-create-btn">
                  <Check size={14} />
                </button>
                <button onClick={() => { setShowCreateChannel(false); setNewChannelName(''); }} className="crm-chat-create-cancel">
                  <X size={14} />
                </button>
              </div>
            )}

            <div className="crm-chat-ch-list">
              {isChannelsLoading ? (
                <div className="crm-chat-empty">Loading rooms…</div>
              ) : channels.map(c => {
                const cid = c.id || c._id;
                const isActive = cid === activeChannelId;
                return (
                  <button
                    key={cid}
                    onClick={() => { setActiveChannelId(cid); setAttachments([]); setRecipient('everyone'); }}
                    className={`crm-chat-ch-btn ${isActive ? 'active' : ''}`}
                  >
                    <Hash size={15} />
                    <span className="truncate">{c.name}</span>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* ═══ CENTER: Chat ═══ */}
        <div className="crm-chat-col-center">
          <Card className="crm-chat-card crm-chat-center-card">
            {/* ─ Header ─ */}
            <div className="crm-chat-center-hdr">
              <div className="crm-chat-hdr-main">
                <span className="crm-chat-hdr-hash">
                  <Hash size={18} />
                </span>
                <div className="crm-chat-hdr-text">
                  <h4 className="crm-chat-ch-name">{activeChannel?.name || 'Channel'}</h4>
                  <span className="crm-chat-hdr-sub">
                    {memberCount} member{memberCount !== 1 ? 's' : ''}
                    {onlineCount > 0 && (
                      <>
                        <span className="crm-chat-hdr-dot" />
                        {onlineCount} online
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* ─ Messages scroll area ─ */}
            <div ref={scrollRef} className="crm-chat-messages">
              {isMessagesLoading ? (
                <div className="crm-chat-empty-center">
                  <Loader2 size={24} className="animate-spin text-blue-500" />
                  <span>Loading messages…</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="crm-chat-empty-center">
                  <MessageSquare size={40} className="text-slate-300 dark:text-slate-600" />
                  <span>Start the conversation. Send a message!</span>
                </div>
              ) : (
                groupedMessages.map((msg) => {
                  const msgId = msg.id || msg._id;
                  const isOwn = (msg.sender?.email === user?.email);
                  const isDM = msg.recipient && msg.recipient !== 'everyone' && !msg.recipient.startsWith('role:');
                  const isRoleGroup = msg.recipient?.startsWith('role:');
                  const isBroadcast = !msg.recipient || msg.recipient === 'everyone';

                  return (
                    <div
                      key={msgId}
                      className={`crm-msg-row ${isOwn ? 'own' : 'other'} ${msg.isFirstInGroup ? 'first-in-group' : 'continuation'}`}
                    >
                      {/* Avatar (only on first in group) */}
                      {msg.isFirstInGroup && (
                        <div className="crm-msg-avatar">
                          {msg.sender?.avatar ? (
                            <img src={msg.sender.avatar} alt="" className="crm-msg-avatar-img" />
                          ) : (
                            <div className="crm-msg-avatar-initials">
                              {msg.sender?.firstName?.[0]}{msg.sender?.lastName?.[0]}
                            </div>
                          )}
                        </div>
                      )}

                      <div className={`crm-msg-body ${!msg.isFirstInGroup ? 'no-avatar' : ''}`}>
                        {/* Header line (only first in group) */}
                        {msg.isFirstInGroup && (
                          <div className="crm-msg-header">
                            <span className="crm-msg-name">
                              {msg.sender?.firstName} {msg.sender?.lastName}
                            </span>
                            <Badge variant="outline" className="crm-msg-role-badge">
                              {msg.sender?.role?.replace('_', ' ')}
                            </Badge>
                            <span className="crm-msg-time">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isDM && (
                              <span className="crm-msg-dm-tag"><Lock size={10} /> DM</span>
                            )}
                            {isRoleGroup && (
                              <span className="crm-msg-role-tag"><Shield size={10} /> {ROLE_LABELS[msg.recipient.replace('role:', '')] || msg.recipient}</span>
                            )}
                            {msg.isPinned && (
                              <span className="crm-msg-pin-tag"><Pin size={10} /> Pinned</span>
                            )}
                          </div>
                        )}

                        {/* Bubble */}
                        <div className={`crm-msg-bubble ${
                          isDM ? (isOwn ? 'dm-own' : 'dm-other')
                            : isRoleGroup ? (isOwn ? 'role-own' : 'role-other')
                              : isOwn ? 'self' : 'peer'
                        }`}>
                          {msg.content && <span>{msg.content}</span>}

                          {msg.attachments?.length > 0 && (
                            <div className="crm-msg-attachments">
                              {msg.attachments.map((att, idx) => (
                                <div key={idx} className="crm-msg-att-item">
                                  <FileText size={14} />
                                  <span className="crm-msg-att-name">{att.name}</span>
                                  <button onClick={() => openPreview(att)} className="crm-msg-att-action">Preview</button>
                                  <a href={att.url} download target="_blank" rel="noopener noreferrer" className="crm-msg-att-action">
                                    <Download size={12} />
                                  </a>
                                </div>
                              ))}
                            </div>
                          )}

                          {isBroadcast && msg.broadcastCount > 0 && msg.isFirstInGroup && (
                            <div className="crm-msg-receipt">
                              sent to all {msg.broadcastCount} members
                            </div>
                          )}
                        </div>

                        {/* Context actions */}
                        <div className="crm-msg-actions">
                          {canPinMessage() && (
                            <button onClick={() => handlePin(msgId)} className="crm-msg-action-btn" title={msg.isPinned ? 'Unpin' : 'Pin'}>
                              <Pin size={12} />
                            </button>
                          )}
                          {canDeleteMessage(msg) && (
                            <button onClick={() => handleDelete(msgId)} className="crm-msg-action-btn danger" title="Delete">
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* ─ Attachments pending ─ */}
            {attachments.length > 0 && (
              <div className="crm-chat-pending-att">
                {attachments.map((att, idx) => (
                  <Badge key={idx} variant="secondary" className="gap-1.5 text-[10px] pl-2">
                    <ImageIcon size={12} />
                    <span>{att.fileName}</span>
                    <button onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))} className="crm-att-remove">×</button>
                  </Badge>
                ))}
              </div>
            )}

            {/* ─ Compose bar (pinned to bottom) ─ */}
            <div className="crm-chat-compose">
              {/* Recipient bar */}
              <div className="crm-compose-recipient" ref={recipientDropdownRef}>
                <span className="crm-compose-to-label">To:</span>
                <button
                  type="button"
                  onClick={() => setShowRecipientDropdown(!showRecipientDropdown)}
                  className="crm-compose-to-btn"
                >
                  <RecipientIcon size={12} className={recipient === 'everyone' ? 'text-blue-400' : recipient.startsWith('role:') ? 'text-violet-400' : 'text-amber-400'} />
                  <span className="crm-compose-to-name">{getRecipientLabel()}</span>
                  {recipient === 'everyone' && <span className="crm-compose-to-count">{memberCount}</span>}
                  <ChevronDown size={12} className="text-slate-400 shrink-0" />
                </button>

                {recipient !== 'everyone' && (
                  <button onClick={() => setRecipient('everyone')} className="crm-compose-to-clear" title="Reset to Everyone">
                    <X size={12} />
                  </button>
                )}

                {/* Dropdown */}
                {showRecipientDropdown && (
                  <div className="crm-recipient-dropdown">
                    {showSearch && (
                      <div className="crm-recipient-search">
                        <Search size={13} className="text-slate-400" />
                        <input
                          value={recipientSearch}
                          onChange={e => setRecipientSearch(e.target.value)}
                          placeholder="Search members…"
                          className="crm-recipient-search-input"
                        />
                      </div>
                    )}

                    <div className="crm-recipient-list">
                      {/* 1. Everyone */}
                      <button onClick={() => selectRecipient('everyone')} className={`crm-recipient-opt ${recipient === 'everyone' ? 'selected' : ''}`}>
                        <Globe size={15} className="text-blue-500 shrink-0" />
                        <span className="crm-recipient-opt-label">Everyone</span>
                        <span className="crm-recipient-opt-count">{memberCount}</span>
                        {recipient === 'everyone' && <Check size={13} className="text-blue-500 shrink-0" />}
                      </button>

                      {/* 2. Role groups (admin only) */}
                      {availableRoleGroups.length > 0 && (
                        <>
                          <div className="crm-recipient-divider" />
                          <p className="crm-recipient-section-label">Role Groups</p>
                          {availableRoleGroups.map(role => {
                            const val = `role:${role}`;
                            const count = channelMembers.filter(m => m.role === role).length;
                            return (
                              <button key={val} onClick={() => selectRecipient(val)} className={`crm-recipient-opt ${recipient === val ? 'selected' : ''}`}>
                                <Shield size={15} className="text-violet-500 shrink-0" />
                                <span className="crm-recipient-opt-label">{ROLE_LABELS[role]}</span>
                                <span className="crm-recipient-opt-count">{count}</span>
                                {recipient === val && <Check size={13} className="text-violet-500 shrink-0" />}
                              </button>
                            );
                          })}
                        </>
                      )}

                      {/* 3. Individual members */}
                      <div className="crm-recipient-divider" />
                      <p className="crm-recipient-section-label">Members</p>
                      {filteredRecipientMembers.map(m => {
                        const mid = m.id || m._id;
                        const online = isUserOnline(mid);
                        return (
                          <button key={mid} onClick={() => selectRecipient(mid)} className={`crm-recipient-opt ${recipient === mid ? 'selected' : ''}`}>
                            <div className="crm-recipient-avatar-wrap">
                              {m.avatar ? (
                                <img src={m.avatar} alt="" className="crm-recipient-avatar" />
                              ) : (
                                <div className="crm-recipient-avatar-init">{m.firstName?.[0]}{m.lastName?.[0]}</div>
                              )}
                              <span className={`crm-recipient-dot ${online ? 'online' : ''}`} />
                            </div>
                            <div className="crm-recipient-info">
                              <span className="crm-recipient-name">{m.firstName} {m.lastName}</span>
                              <span className="crm-recipient-role">{m.role?.replace('_', ' ')}</span>
                            </div>
                            {recipient === mid && <Check size={13} className="text-amber-500 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Input row */}
              <form onSubmit={handleSend} className="crm-compose-row">
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                <Button type="button" variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="h-10 w-10 shrink-0">
                  {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} className="text-slate-500" />}
                </Button>

                <textarea
                  id="chat-message-input"
                  value={typedMessage}
                  onChange={e => setTypedMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    recipient === 'everyone' ? 'Message everyone…'
                      : recipient.startsWith('role:') ? `Message ${getRecipientLabel()}…`
                        : `Private message to ${getRecipientLabel()}…`
                  }
                  disabled={isSending}
                  rows={1}
                  className="crm-compose-textarea"
                />

                <Button
                  type="submit"
                  size="icon"
                  disabled={isSending || (!typedMessage.trim() && attachments.length === 0)}
                  className={`h-10 w-10 shrink-0 text-white ${
                    recipient.startsWith('role:') ? 'bg-violet-600 hover:bg-violet-700'
                      : recipient !== 'everyone' ? 'bg-amber-600 hover:bg-amber-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  <Send size={16} />
                </Button>
              </form>
            </div>
          </Card>
        </div>

        {/* ═══ RIGHT: Members ═══ */}
        <div className="crm-chat-col-right">
          <Card className="crm-chat-card">
            <div className="crm-chat-panel-hdr">
              <h3 className="crm-chat-panel-title">
                <Users size={16} className="text-blue-500" />
                <span>Room Members</span>
              </h3>
              <Badge variant="secondary" className="crm-chat-member-badge-sm">{memberCount}</Badge>
            </div>

            <div className="crm-chat-members-list">
              {sortedMembers.map(m => {
                const mid = m.id || m._id;
                const online = isUserOnline(mid);
                const isMe = mid === currentUserId;
                return (
                  <button
                    key={mid}
                    onClick={() => {
                      if (!isMe) {
                        setRecipient(mid);
                        toast.success(`Now messaging ${m.firstName} ${m.lastName} privately`);
                      }
                    }}
                    className={`crm-member-item ${recipient === mid ? 'selected' : ''} ${isMe ? 'is-me' : ''}`}
                    title={isMe ? 'You' : `Click to DM ${m.firstName}`}
                  >
                    <div className="crm-member-avatar-wrap">
                      {m.avatar ? (
                        <img src={m.avatar} alt="" className="crm-member-avatar" />
                      ) : (
                        <div className="crm-member-avatar-init">{m.firstName?.[0]}{m.lastName?.[0]}</div>
                      )}
                      <span className={`crm-member-dot ${online ? 'online' : ''}`} />
                    </div>
                    <div className="crm-member-info">
                      <div className="crm-member-name">
                        {m.firstName} {m.lastName}
                        {isMe && <span className="crm-member-you">(you)</span>}
                      </div>
                      <div className="crm-member-role">{m.role?.replace('_', ' ')}</div>
                    </div>
                    {recipient === mid && <Lock size={12} className="text-amber-500 ml-auto shrink-0" />}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      <AttachmentPreviewModal
        file={previewFile}
        isOpen={previewOpen}
        onClose={() => { setPreviewOpen(false); setPreviewFile(null); }}
      />

      <style>{chatStyles}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Styles — injected via <style> so everything is self-contained.
   ══════════════════════════════════════════════════════════════════ */

const chatStyles = `
/* ── Root & 3-column layout ─────────────────────────────────────────
   Full-bleed: cancel the AppLayout <main> padding (32px 40px) so the
   workspace fills the entire content area edge-to-edge, like Slack.
   ─────────────────────────────────────────────────────────────────── */
.crm-chat-root {
  display: flex;
  flex-direction: column;
  margin: -32px -40px;
  height: calc(100% + 64px);
  min-height: 0;
  background:
    radial-gradient(1200px 600px at 70% -10%, rgb(37 99 235 / 0.07), transparent 60%),
    #0b1220;
}

.crm-chat-columns {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.crm-chat-col-left   { width: 264px; flex-shrink: 0; display: flex; flex-direction: column; min-height: 0; }
.crm-chat-col-center { flex: 1; min-width: 0; display: flex; flex-direction: column; min-height: 0; }
.crm-chat-col-right  { width: 248px; flex-shrink: 0; display: flex; flex-direction: column; min-height: 0; }

/* Panels are flush surfaces separated by hairlines (one connected app). */
.crm-chat-card {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  border: none !important;
  border-radius: 0 !important;
  background: rgb(15 23 42 / 0.55) !important;
  backdrop-filter: blur(6px);
  overflow: hidden;
  box-shadow: none !important;
}
.crm-chat-col-left .crm-chat-card { background: rgb(13 20 38 / 0.7) !important; }
.crm-chat-col-left .crm-chat-card,
.crm-chat-col-center .crm-chat-card {
  border-right: 1px solid rgb(148 163 184 / 0.08) !important;
}

.crm-chat-center-card {
  display: flex;
  flex-direction: column;
}

/* ── Panel headers ──────────────────────────────────────────────── */
.crm-chat-panel-hdr {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px;
  border-bottom: 1px solid rgb(148 163 184 / 0.08);
  flex-shrink: 0;
}

.crm-chat-panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 13px;
  color: #f1f5f9;
}

.crm-chat-icon-btn {
  padding: 4px;
  border-radius: 6px;
  color: #94a3b8;
  transition: all 0.15s;
  cursor: pointer;
  background: transparent;
  border: none;
}
.crm-chat-icon-btn:hover { background: rgb(51 65 85 / 0.6); color: #e2e8f0; }

/* ── Create channel inline ──────────────────────────────────────── */
.crm-chat-create-ch {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border-bottom: 1px solid rgb(30 41 59 / 0.6);
  flex-shrink: 0;
}
.crm-chat-create-input {
  flex: 1;
  font-size: 12px;
  padding: 5px 8px;
  border-radius: 6px;
  border: 1px solid #334155;
  background: #0f172a;
  color: #f1f5f9;
  outline: none;
}
.crm-chat-create-input:focus { border-color: #3b82f6; }
.crm-chat-create-btn, .crm-chat-create-cancel {
  padding: 4px;
  border-radius: 5px;
  border: none;
  cursor: pointer;
  background: transparent;
}
.crm-chat-create-btn { color: #22c55e; }
.crm-chat-create-btn:hover { background: rgb(34 197 94 / 0.15); }
.crm-chat-create-cancel { color: #94a3b8; }
.crm-chat-create-cancel:hover { background: rgb(51 65 85 / 0.5); }

/* ── Channel list ───────────────────────────────────────────────── */
.crm-chat-ch-list {
  flex: 1;
  overflow-y: auto;
  padding: 6px;
}

.crm-chat-ch-btn {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 9px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: #94a3b8;
  transition: all 0.15s;
  cursor: pointer;
  border: none;
  background: transparent;
  text-align: left;
  margin-bottom: 2px;
}
.crm-chat-ch-btn svg { color: #64748b; transition: color 0.15s; }
.crm-chat-ch-btn:hover { background: rgb(51 65 85 / 0.4); color: #e2e8f0; }
.crm-chat-ch-btn:hover svg { color: #94a3b8; }
.crm-chat-ch-btn.active {
  background: rgb(37 99 235 / 0.14);
  color: #fff;
}
.crm-chat-ch-btn.active svg { color: #60a5fa; }
.crm-chat-ch-btn.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 6px;
  bottom: 6px;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: #3b82f6;
}

/* ── Center header ──────────────────────────────────────────────── */
.crm-chat-center-hdr {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 22px;
  border-bottom: 1px solid rgb(148 163 184 / 0.08);
  background: rgb(15 23 42 / 0.4);
  flex-shrink: 0;
}
.crm-chat-hdr-main { display: flex; align-items: center; gap: 12px; min-width: 0; }
.crm-chat-hdr-hash {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: rgb(37 99 235 / 0.14);
  color: #60a5fa;
  flex-shrink: 0;
}
.crm-chat-hdr-text { min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.crm-chat-hdr-sub {
  font-size: 11px;
  color: #64748b;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
}
.crm-chat-hdr-dot {
  display: inline-block;
  width: 3px; height: 3px;
  border-radius: 50%;
  background: #475569;
  margin: 0 7px;
}

.crm-chat-ch-name {
  font-weight: 700;
  font-size: 15px;
  color: #f1f5f9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.crm-chat-member-badge {
  font-size: 10px !important;
  padding: 1px 7px !important;
  border-radius: 99px;
}
.crm-chat-member-badge-sm {
  font-size: 9px !important;
  padding: 0 6px !important;
  border-radius: 99px;
}

/* ── Messages area ──────────────────────────────────────────────── */
.crm-chat-messages {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding: 20px 28px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.crm-chat-messages::-webkit-scrollbar { width: 5px; }
.crm-chat-messages::-webkit-scrollbar-track { background: transparent; }
.crm-chat-messages::-webkit-scrollbar-thumb { background: rgb(100 116 139 / 0.2); border-radius: 3px; }
.crm-chat-messages::-webkit-scrollbar-thumb:hover { background: rgb(100 116 139 / 0.4); }

.crm-chat-empty, .crm-chat-empty-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 100%;
  color: #64748b;
  font-size: 12px;
}

/* ── Message rows ───────────────────────────────────────────────── */
.crm-msg-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  max-width: min(74%, 640px);
  position: relative;
}
.crm-msg-row.own {
  margin-left: auto;
  flex-direction: row-reverse;
}
.crm-msg-row.other {
  margin-right: auto;
}
.crm-msg-row.first-in-group {
  margin-top: 12px;
}
.crm-msg-row.continuation {
  margin-top: 2px;
}

/* Avatar */
.crm-msg-avatar { flex-shrink: 0; }
.crm-msg-avatar-img {
  width: 32px; height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid rgb(51 65 85 / 0.5);
}
.crm-msg-avatar-initials {
  width: 32px; height: 32px;
  border-radius: 50%;
  background: #334155;
  color: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
}

/* Body wrapper */
.crm-msg-body {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  position: relative;
}
.crm-msg-body.no-avatar {
  margin-left: 42px; /* 32px avatar + 10px gap */
}
.crm-msg-row.own .crm-msg-body.no-avatar {
  margin-left: 0;
  margin-right: 42px;
}

/* Header line */
.crm-msg-header {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.crm-msg-row.own .crm-msg-header {
  justify-content: flex-end;
}
.crm-msg-name {
  font-size: 12px;
  font-weight: 700;
  color: #cbd5e1;
}
.crm-msg-role-badge {
  font-size: 9px !important;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0 5px !important;
  border-radius: 4px;
}
.crm-msg-time {
  font-size: 10px;
  color: #64748b;
}
.crm-msg-dm-tag, .crm-msg-role-tag, .crm-msg-pin-tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 9px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 4px;
}
.crm-msg-dm-tag { color: #fbbf24; background: rgb(251 191 36 / 0.12); }
.crm-msg-role-tag { color: #a78bfa; background: rgb(167 139 250 / 0.12); }
.crm-msg-pin-tag { color: #38bdf8; background: rgb(56 189 248 / 0.12); }

/* Bubbles */
.crm-msg-bubble {
  padding: 9px 14px;
  border-radius: 14px;
  font-size: 13.5px;
  line-height: 1.5;
  word-break: break-word;
  position: relative;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.15);
}
.crm-msg-bubble.self {
  background: linear-gradient(180deg, #2f6bff 0%, #2563eb 100%);
  color: #fff;
  border-top-right-radius: 4px;
}
.crm-msg-bubble.peer {
  background: #1e293b;
  color: #e8eef6;
  border: 1px solid rgb(148 163 184 / 0.1);
  border-top-left-radius: 4px;
}
.crm-msg-bubble.dm-own {
  background: #d97706;
  color: #fff;
  border-top-right-radius: 4px;
}
.crm-msg-bubble.dm-other {
  background: rgb(217 119 6 / 0.15);
  color: #fde68a;
  border: 1px solid rgb(217 119 6 / 0.3);
  border-top-left-radius: 4px;
}
.crm-msg-bubble.role-own {
  background: #7c3aed;
  color: #fff;
  border-top-right-radius: 4px;
}
.crm-msg-bubble.role-other {
  background: rgb(124 58 237 / 0.15);
  color: #c4b5fd;
  border: 1px solid rgb(124 58 237 / 0.3);
  border-top-left-radius: 4px;
}

/* Continuation bubbles without rounded start */
.crm-msg-row.continuation .crm-msg-bubble {
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
}

/* Broadcast receipt */
.crm-msg-receipt {
  font-size: 10px;
  color: rgb(148 163 184 / 0.7);
  margin-top: 4px;
  font-style: italic;
}

/* Attachments in bubbles */
.crm-msg-attachments {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  border-top: 1px solid rgb(255 255 255 / 0.1);
  padding-top: 6px;
}
.crm-msg-att-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: rgb(0 0 0 / 0.15);
  border-radius: 6px;
  font-size: 11px;
}
.crm-msg-att-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}
.crm-msg-att-action {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 4px;
  border-radius: 4px;
  cursor: pointer;
  background: transparent;
  border: none;
  color: inherit;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
}
.crm-msg-att-action:hover { background: rgb(255 255 255 / 0.15); }

/* Hover actions */
.crm-msg-actions {
  display: none;
  gap: 2px;
  position: absolute;
  top: -4px;
  right: -4px;
}
.crm-msg-row.own .crm-msg-actions { right: auto; left: -4px; }
.crm-msg-row:hover .crm-msg-actions { display: flex; }

.crm-msg-action-btn {
  padding: 3px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  background: #1e293b;
  color: #94a3b8;
  border: 1px solid #334155;
  display: flex;
  align-items: center;
  justify-content: center;
}
.crm-msg-action-btn:hover { background: #334155; color: #e2e8f0; }
.crm-msg-action-btn.danger:hover { background: rgb(239 68 68 / 0.2); color: #f87171; }

/* ── Pending attachments ────────────────────────────────────────── */
.crm-chat-pending-att {
  padding: 6px 20px;
  border-top: 1px solid rgb(30 41 59 / 0.6);
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  flex-shrink: 0;
  background: rgb(15 23 42 / 0.6);
}
.crm-att-remove {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  padding: 0 2px;
}
.crm-att-remove:hover { color: #f87171; }

/* ── Compose bar ────────────────────────────────────────────────── */
.crm-chat-compose {
  border-top: 1px solid rgb(30 41 59 / 0.6);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}

/* Recipient bar */
.crm-compose-recipient {
  display: flex;
  align-items: center;
  padding: 5px 16px;
  background: rgb(15 23 42 / 0.4);
  border-bottom: 1px solid rgb(30 41 59 / 0.4);
  position: relative;
  flex-shrink: 0;
}
.crm-compose-to-label {
  font-size: 10px;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-right: 6px;
  flex-shrink: 0;
}
.crm-compose-to-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  border-radius: 6px;
  background: rgb(30 41 59 / 0.8);
  border: 1px solid #334155;
  cursor: pointer;
  transition: all 0.15s;
  color: #e2e8f0;
  font-size: 12px;
  font-weight: 600;
}
.crm-compose-to-btn:hover { border-color: #3b82f6; box-shadow: 0 0 0 2px rgb(59 130 246 / 0.12); }
.crm-compose-to-name {
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.crm-compose-to-count {
  font-size: 10px;
  padding: 0 4px;
  border-radius: 99px;
  background: rgb(59 130 246 / 0.2);
  color: #60a5fa;
  font-weight: 700;
}
.crm-compose-to-clear {
  margin-left: 4px;
  padding: 2px;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
}
.crm-compose-to-clear:hover { background: rgb(51 65 85 / 0.5); color: #f87171; }

/* Input row */
.crm-compose-row {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  padding: 12px 18px 16px;
  flex-shrink: 0;
}

.crm-compose-textarea {
  flex: 1;
  min-height: 44px;
  max-height: 140px;
  border-radius: 12px;
  border: 1px solid rgb(148 163 184 / 0.14);
  background: rgb(15 23 42 / 0.9);
  padding: 11px 14px;
  font-size: 13.5px;
  line-height: 1.45;
  color: #f1f5f9;
  resize: none;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.crm-compose-textarea:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgb(59 130 246 / 0.12); }
.crm-compose-textarea::placeholder { color: #64748b; }

/* ── Recipient dropdown ─────────────────────────────────────────── */
.crm-recipient-dropdown {
  position: absolute;
  bottom: calc(100% + 4px);
  left: 12px;
  width: 280px;
  max-height: 370px;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 10px;
  box-shadow: 0 12px 40px -8px rgb(0 0 0 / 0.5);
  z-index: 60;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.crm-recipient-search {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border-bottom: 1px solid #1e293b;
  flex-shrink: 0;
}
.crm-recipient-search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 12px;
  color: #e2e8f0;
}
.crm-recipient-search-input::placeholder { color: #64748b; }

.crm-recipient-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px;
}
.crm-recipient-list::-webkit-scrollbar { width: 4px; }
.crm-recipient-list::-webkit-scrollbar-thumb { background: rgb(100 116 139 / 0.2); border-radius: 2px; }

.crm-recipient-divider {
  height: 1px;
  background: #1e293b;
  margin: 4px 8px;
}

.crm-recipient-section-label {
  font-size: 9px;
  color: #64748b;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 6px 12px 2px;
  margin: 0;
}

.crm-recipient-opt {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 6px;
  font-size: 12px;
  color: #cbd5e1;
  cursor: pointer;
  border: none;
  background: transparent;
  text-align: left;
  transition: background 0.12s;
}
.crm-recipient-opt:hover { background: rgb(51 65 85 / 0.4); }
.crm-recipient-opt.selected { background: rgb(37 99 235 / 0.12); }

.crm-recipient-opt-label {
  flex: 1;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.crm-recipient-opt-count {
  font-size: 10px;
  padding: 0 5px;
  border-radius: 99px;
  background: rgb(100 116 139 / 0.2);
  color: #94a3b8;
  font-weight: 700;
}

.crm-recipient-avatar-wrap {
  position: relative;
  flex-shrink: 0;
}
.crm-recipient-avatar {
  width: 24px; height: 24px;
  border-radius: 50%;
  object-fit: cover;
}
.crm-recipient-avatar-init {
  width: 24px; height: 24px;
  border-radius: 50%;
  background: #334155;
  color: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
}
.crm-recipient-dot {
  position: absolute;
  bottom: -1px;
  right: -1px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #64748b;
  border: 1.5px solid #0f172a;
}
.crm-recipient-dot.online { background: #22c55e; }

.crm-recipient-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.crm-recipient-name {
  font-weight: 600;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.crm-recipient-role {
  font-size: 9px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* ── Right panel member list ────────────────────────────────────── */
.crm-chat-members-list {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding: 6px;
}
.crm-chat-members-list::-webkit-scrollbar { width: 4px; }
.crm-chat-members-list::-webkit-scrollbar-thumb { background: rgb(100 116 139 / 0.2); border-radius: 2px; }

.crm-member-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 8px;
  cursor: pointer;
  border: none;
  background: transparent;
  text-align: left;
  transition: all 0.12s;
}
.crm-member-item:hover:not(.is-me) { background: rgb(51 65 85 / 0.4); }
.crm-member-item.selected {
  background: rgb(217 119 6 / 0.1);
  outline: 1px solid rgb(217 119 6 / 0.25);
}
.crm-member-item.is-me { cursor: default; opacity: 0.7; }

.crm-member-avatar-wrap { position: relative; flex-shrink: 0; }
.crm-member-avatar {
  width: 28px; height: 28px;
  border-radius: 50%;
  object-fit: cover;
}
.crm-member-avatar-init {
  width: 28px; height: 28px;
  border-radius: 50%;
  background: #334155;
  color: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
}
.crm-member-dot {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #64748b;
  border: 1.5px solid rgb(15 23 42);
}
.crm-member-dot.online { background: #22c55e; }

.crm-member-info { min-width: 0; flex: 1; }
.crm-member-name {
  font-size: 12px;
  font-weight: 700;
  color: #cbd5e1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.crm-member-you {
  font-size: 10px;
  font-weight: 500;
  color: #64748b;
  margin-left: 4px;
}
.crm-member-role {
  font-size: 9px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 500;
}

/* ── Responsive ─────────────────────────────────────────────────── */
@media (max-width: 1023px) {
  .crm-chat-col-right { display: none; }
  .crm-chat-col-left { width: 200px; }
}
@media (max-width: 768px) {
  .crm-chat-col-left { display: none; }
}
`;
