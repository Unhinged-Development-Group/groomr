// Messages — split-pane: thread list + active conversation. Customer + groomer views.

const CUSTOMER_THREADS = [
  { id: "t1", with: "Lola García", from: "Wagington & Co.", avatar: "L", last: "Sounds good — see you Sat 10:30!", when: "2h", unread: 0,
    msgs: [
      { from: "them", t: "Hi Anya — quick note: Marlow's appointment is confirmed for Sat 23 May, 10:30." },
      { from: "them", t: "Anything we should know? Last time he was a star with the dryer." },
      { from: "me",   t: "All good! He's been due a nail trim too if you have time." },
      { from: "them", t: "Sounds good — see you Sat 10:30!" },
    ] },
  { id: "t2", with: "Hounds & Honey", from: "Petra Holm", avatar: "P", last: "We can fit Biscuit in next Wednesday at 11.", when: "1d", unread: 1,
    msgs: [
      { from: "them", t: "We can fit Biscuit in next Wednesday at 11." },
    ] },
  { id: "t3", with: "Top Dog Studio", from: "Reception", avatar: "T", last: "Receipt sent to your email.", when: "3d", unread: 0,
    msgs: [{ from: "them", t: "Receipt sent to your email." }] },
];

const GROOMER_THREADS = [
  { id: "g1", with: "Sarah Khan", from: "Murphy's owner", avatar: "S", last: "Thanks Lola — see you Sat!", when: "1h", unread: 0,
    msgs: [
      { from: "them", t: "Hey, just confirming Saturday for Murphy?" },
      { from: "me",   t: "Yes — 10:30am. We'll go slow with him as always." },
      { from: "them", t: "Thanks Lola — see you Sat!" },
    ] },
  { id: "g2", with: "Daniel Reid", from: "Pippa's owner", avatar: "D", last: "Could we shift to Sunday morning?", when: "3h", unread: 2,
    msgs: [
      { from: "them", t: "Hi! Something came up Saturday — sorry." },
      { from: "them", t: "Could we shift to Sunday morning?" },
    ] },
  { id: "g3", with: "Imogen Tate", from: "Otis's owner", avatar: "I", last: "Hand-strip only please, leave the beard.", when: "1d", unread: 0,
    msgs: [{ from: "them", t: "Hand-strip only please, leave the beard." }] },
  { id: "g4", with: "Priya Nair", from: "Bean's owner (new)", avatar: "P", last: "First time here — anything I should bring?", when: "2d", unread: 1,
    msgs: [{ from: "them", t: "First time here — anything I should bring?" }] },
];

const Messages = ({ user, mode = "customer" }) => {
  const seed = mode === "groomer" ? GROOMER_THREADS : CUSTOMER_THREADS;
  const [threads, setThreads] = React.useState(seed);
  const [activeId, setActiveId] = React.useState(seed[0].id);
  const [draft, setDraft] = React.useState("");
  const active = threads.find(t => t.id === activeId);

  React.useEffect(() => { setThreads(seed); setActiveId(seed[0].id); }, [mode]);

  // Mark active thread read
  React.useEffect(() => {
    setThreads(ts => ts.map(t => t.id === activeId ? { ...t, unread: 0 } : t));
  }, [activeId]);

  const send = () => {
    const t = draft.trim();
    if (!t) return;
    setThreads(ts => ts.map(x => x.id === activeId ? { ...x, last: t, when: "now", msgs: [...x.msgs, { from: "me", t }] } : x));
    setDraft("");
  };

  return (
    <div className="page-fade w-full px-6 lg:px-12 xl:px-20 py-8">
      <header className="mb-5">
        <Eyebrow>Messages</Eyebrow>
        <h1 className="font-fredoka text-3xl md:text-4xl text-deep-slate mt-1">
          {mode === "groomer" ? "Talk to your clients" : "Talk to your groomers"}
        </h1>
      </header>

      <div className="bg-white border border-pebble-grey/20 rounded-[20px] overflow-hidden grid md:grid-cols-[320px_1fr] min-h-[560px]">
        {/* Thread list */}
        <aside className="border-r border-pebble-grey/15 max-h-[640px] overflow-y-auto">
          {threads.map(t => (
            <button key={t.id} onClick={() => setActiveId(t.id)}
              className={`w-full text-left p-4 flex items-start gap-3 border-b border-pebble-grey/10 transition-colors focus-ring ${activeId===t.id?"bg-alabaster-cream":"hover:bg-alabaster-cream/60"}`}>
              <div className="w-10 h-10 rounded-full bg-sage-leaf text-white font-fredoka flex items-center justify-center shrink-0">{t.avatar}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-bold text-sm text-deep-slate truncate">{t.with}</p>
                  <span className="text-[10px] text-pebble-grey font-bold shrink-0">{t.when}</span>
                </div>
                <p className="text-xs text-pebble-grey font-bold truncate">{t.from}</p>
                <p className={`text-xs mt-1 truncate ${t.unread?"text-deep-slate font-bold":"text-pebble-grey"}`}>{t.last}</p>
              </div>
              {t.unread > 0 && <span className="bg-muted-terracotta text-alabaster-cream text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">{t.unread}</span>}
            </button>
          ))}
        </aside>

        {/* Active conversation */}
        <section className="flex flex-col">
          {active && (
            <>
              <div className="px-5 py-4 border-b border-pebble-grey/15 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-sage-leaf text-white font-fredoka flex items-center justify-center">{active.avatar}</div>
                <div className="min-w-0">
                  <p className="font-fredoka text-lg text-deep-slate">{active.with}</p>
                  <p className="text-xs text-pebble-grey font-bold">{active.from}</p>
                </div>
              </div>
              <div className="flex-1 p-5 space-y-3 overflow-y-auto" style={{ maxHeight: "480px" }}>
                {active.msgs.map((m,i) => (
                  <div key={i} className={`flex ${m.from==="me"?"justify-end":"justify-start"}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${m.from==="me"?"bg-deep-slate text-alabaster-cream":"bg-alabaster-cream text-deep-slate border border-pebble-grey/15"}`}>
                      {m.t}
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-pebble-grey/15 p-4 flex gap-2">
                <input value={draft} onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key==="Enter" && send()}
                  placeholder="Write a message…" className="field flex-1"/>
                <button onClick={send} className="btn-primary font-nunito font-bold px-5 py-2 rounded-full text-sm focus-ring">Send</button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

window.Messages = Messages;
