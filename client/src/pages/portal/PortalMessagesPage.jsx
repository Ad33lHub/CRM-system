import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  useGetPortalProjectsQuery,
  useGetPortalThreadsQuery,
  useGetPortalMessagesQuery,
  useSendPortalMessageMutation,
} from '../../services/portalApi.js';
import { MessagesSquare, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PortalMessagesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: projData } = useGetPortalProjectsQuery();
  const { data: threadData } = useGetPortalThreadsQuery();
  const projects = useMemo(() => projData?.data || [], [projData]);
  const threads = useMemo(() => threadData?.data || [], [threadData]);

  const unreadByProject = useMemo(() => {
    const map = {};
    threads.forEach((t) => {
      map[t.project._id] = t.unread || 0;
    });
    return map;
  }, [threads]);

  const [activeId, setActiveId] = useState(searchParams.get('projectId') || '');

  // Default to the first project once loaded.
  useEffect(() => {
    if (!activeId && projects.length) {
      setActiveId(projects[0]._id || projects[0].id);
    }
  }, [projects, activeId]);

  const { data: msgData, isFetching } = useGetPortalMessagesQuery(activeId, { skip: !activeId });
  const messages = useMemo(() => msgData?.data || [], [msgData]);
  const [sendMessage, { isLoading: isSending }] = useSendPortalMessageMutation();
  const [body, setBody] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectProject = (pid) => {
    setActiveId(pid);
    setSearchParams({ projectId: pid });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const text = body.trim();
    if (!text || !activeId) return;
    try {
      await sendMessage({ projectId: activeId, body: text }).unwrap();
      setBody('');
    } catch (err) {
      toast.error(err.data?.message || 'Failed to send message');
    }
  };

  const activeProject = projects.find((p) => (p._id || p.id) === activeId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Messages</h1>
        <p className="text-sm text-slate-400">
          Reach your project manager directly. Pick a project to start the conversation.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_1fr]">
        {/* Project list */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <div className="border-b border-slate-100 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800">
            Conversations
          </div>
          {projects.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-400">No projects yet.</p>
          ) : (
            <ul className="max-h-[60vh] divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
              {projects.map((p) => {
                const pid = p._id || p.id;
                const isActive = pid === activeId;
                const unread = unreadByProject[pid] || 0;
                return (
                  <li key={pid}>
                    <button
                      onClick={() => selectProject(pid)}
                      className={`flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-colors ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-950/30'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <span className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {p.name}
                      </span>
                      {unread > 0 && (
                        <span className="shrink-0 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                          {unread}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Thread */}
        <div className="flex h-[60vh] flex-col rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          {!activeId ? (
            <div className="flex flex-1 flex-col items-center justify-center text-slate-400">
              <MessagesSquare className="mb-3 h-12 w-12 text-slate-300 dark:text-slate-600" />
              <p className="text-sm">Select a project to view messages.</p>
            </div>
          ) : (
            <>
              <div className="border-b border-slate-100 px-5 py-3 dark:border-slate-800">
                <p className="font-bold text-slate-800 dark:text-slate-100">{activeProject?.name}</p>
                <p className="text-[11px] text-slate-400">Project manager &amp; team</p>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
                {isFetching && messages.length === 0 ? (
                  <p className="text-center text-sm text-slate-400">Loading…</p>
                ) : messages.length === 0 ? (
                  <p className="py-10 text-center text-sm text-slate-400">
                    No messages yet. Say hello to your project team.
                  </p>
                ) : (
                  messages.map((m) => {
                    const mine = m.fromClient;
                    return (
                      <div key={m._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm ${
                            mine
                              ? 'rounded-br-sm bg-blue-600 text-white'
                              : 'rounded-bl-sm bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100'
                          }`}
                        >
                          {!mine && (
                            <p className="mb-0.5 text-[11px] font-bold opacity-70">
                              {m.sender?.firstName} {m.sender?.lastName}
                            </p>
                          )}
                          <p className="whitespace-pre-wrap break-words">{m.body}</p>
                          <p className={`mt-1 text-[10px] ${mine ? 'text-blue-100/80' : 'text-slate-400'}`}>
                            {new Date(m.createdAt).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={endRef} />
              </div>

              <form
                onSubmit={handleSend}
                className="flex items-center gap-2 border-t border-slate-100 p-3 dark:border-slate-800"
              >
                <input
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write a message…"
                  className="h-11 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-100"
                />
                <button
                  type="submit"
                  disabled={isSending || !body.trim()}
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
