import { useState, useRef, useEffect } from "react";
import API from "../api/axios";
import { FiMessageCircle, FiX, FiSend } from "react-icons/fi";
import "./ChatWidget.scss";

const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm your shopping assistant 👋 Ask me about products, prices, or what to buy!" },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setSending(true);

    try {
      const res = await API.post("/ai/chat", { message: text });
      setMessages((prev) => [...prev, { role: "assistant", content: res.data.reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I'm having trouble right now." }]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-widget">
      {open && (
        <div className="chat-panel">
          <div className="chat-panel-head">
            <span>🛍️ Shopping Assistant</span>
            <button onClick={() => setOpen(false)}><FiX size={18} /></button>
          </div>
          <div className="chat-panel-body">
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.role}`}>{m.content}</div>
            ))}
            {sending && <div className="chat-msg assistant typing">Typing…</div>}
            <div ref={bottomRef} />
          </div>
          <div className="chat-panel-footer">
            <input placeholder="Ask about products…" value={input}
              onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} />
            <button onClick={sendMessage} disabled={sending}><FiSend size={16} /></button>
          </div>
        </div>
      )}
      <button className="chat-fab" onClick={() => setOpen((v) => !v)}>
        {open ? <FiX size={22} /> : <FiMessageCircle size={22} />}
      </button>
    </div>
  );
};

export default ChatWidget;