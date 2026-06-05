function parseMarkdownToHtml(text) {
    if (!text) return '';

    // If the text already contains HTML tags, assume it is pre-rendered and return as-is
    if (/<[a-z][\s\S]*>/i.test(text)) {
        return text;
    }

    let html = text;

    // 1. Bold: **text** or __text__ -> <strong>text</strong>
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');

    // 2. Italics: *text* or _text_ -> <em>text</em>
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.*?)_/g, '<em>$1</em>');

    // 3. Headers: ### text -> <h3>text</h3>
    html = html.replace(/^### (.*?)$/gm, '<h3 style="font-weight: 700; margin-top: 10px; margin-bottom: 5px; font-size: 14px; color: var(--color-brass-dark);">$1</h3>');
    html = html.replace(/^## (.*?)$/gm, '<h2 style="font-weight: 700; margin-top: 12px; margin-bottom: 6px; font-size: 15px; color: var(--color-brass-dark);">$1</h2>');
    html = html.replace(/^# (.*?)$/gm, '<h1 style="font-weight: 700; margin-top: 15px; margin-bottom: 8px; font-size: 16px; color: var(--color-brass-dark);">$1</h1>');

    // 4. Parse lists line-by-line
    const lines = html.split('\n');
    let inUnorderedList = false;
    let inOrderedList = false;
    const processedLines = [];

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        
        // Match numbered lists: e.g. "1. Item"
        const orderedMatch = line.match(/^(\d+)\.\s+(.*)$/);
        // Match bullet lists: e.g. "- Item" or "* Item"
        const unorderedMatch = line.match(/^([*-])\s+(.*)$/);

        if (orderedMatch) {
            if (inUnorderedList) {
                processedLines.push('</ul>');
                inUnorderedList = false;
            }
            if (!inOrderedList) {
                processedLines.push('<ol style="list-style-type: decimal; margin-left: 20px; margin-top: 6px; margin-bottom: 6px; display: flex; flex-direction: column; gap: 4px;">');
                inOrderedList = true;
            }
            processedLines.push(`<li>${orderedMatch[2]}</li>`);
        } else if (unorderedMatch) {
            if (inOrderedList) {
                processedLines.push('</ol>');
                inOrderedList = false;
            }
            if (!inUnorderedList) {
                processedLines.push('<ul style="list-style-type: disc; margin-left: 20px; margin-top: 6px; margin-bottom: 6px; display: flex; flex-direction: column; gap: 4px;">');
                inUnorderedList = true;
            }
            processedLines.push(`<li>${unorderedMatch[2]}</li>`);
        } else {
            if (inOrderedList) {
                processedLines.push('</ol>');
                inOrderedList = false;
            }
            if (inUnorderedList) {
                processedLines.push('</ul>');
                inUnorderedList = false;
            }
            
            if (line === '') {
                processedLines.push('<div style="height: 8px;"></div>');
            } else {
                processedLines.push(`<p style="margin-bottom: 6px;">${lines[i]}</p>`);
            }
        }
    }

    if (inOrderedList) processedLines.push('</ol>');
    if (inUnorderedList) processedLines.push('</ul>');

    return processedLines.join('\n');
}

export default function ChatAssistant({
    messages,
    isTyping,
    inputValue,
    setInputValue,
    onSubmit,
    chatMessagesEndRef
}) {
    return (
        <div className="tab-content active h-full flex flex-col overflow-hidden">
            <div className="chat-container flex flex-col h-full overflow-hidden">
                <div className="chat-messages flex-1 p-6 overflow-y-auto flex flex-col gap-5">
                    
                    {/* Messages */}
                    {messages.length === 0 ? (
                        <div className="chat-welcome-card bg-[#fcfbf7] border border-[#e8e3d5] border-l-4 border-l-[#c5a059] rounded p-5 max-w-[600px] mx-auto text-center shadow-sm">
                            <i className="fa-solid fa-brain welcome-icon text-3xl text-[#c5a059] mb-2.5"></i>
                            <h3 className="text-[13px] uppercase font-heading font-bold text-[#190f0a] mb-1.5">HINDSIGHT COGNIZANCE PORTAL</h3>
                            <p className="text-xs text-[#4a4e52] leading-relaxed">
                                This workspace integrates the cross-document evidence compiled in database memory. Ask questions regarding conflicting statements, timelines, and facts.
                            </p>
                        </div>
                    ) : (
                        messages.map((msg, idx) => (
                            <div key={idx} className={`chat-msg flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'self-end' : 'self-start'}`}>
                                <div className={`msg-header text-[10px] uppercase font-bold tracking-wider text-[#4a4e52] mb-1 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                                    {msg.sender === 'user' ? 'Advocate' : msg.isWarning ? 'Investigator Agent' : 'Hindsight Assistant'}
                                </div>
                                
                                {msg.isWarning ? (
                                    <div className="msg-bubble p-4 rounded shadow bg-[#fdf2f2] border border-[#f5c2c2] text-[#8b0000] text-xs">
                                        <strong className="block mb-1 font-heading font-bold text-xs">{msg.title}</strong>
                                        {msg.text}
                                    </div>
                                ) : (
                                    <div 
                                        className={`msg-bubble px-4 py-3 rounded text-[13px] leading-relaxed shadow ${msg.sender === 'user' ? 'bg-[#121e36] text-[#fcfbf7] rounded-br-none' : 'bg-[#fcfbf7] text-[#190f0a] border border-[#e8e3d5] rounded-bl-none'}`}
                                        dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(msg.text) }}
                                    />
                                )}
                            </div>
                        ))
                    )}

                    {isTyping && (
                        <div className="chat-msg assistant self-start">
                            <div className="msg-header text-[10px] uppercase font-bold text-[#4a4e52] mb-1">Analyzing Case Memory</div>
                            <div className="msg-bubble px-4 py-3.5 bg-white border border-[#e8e3d5] rounded rounded-bl-none shadow">
                                <div className="typing-dots flex gap-1 items-center h-[18px]">
                                    <span className="w-1.5 h-1.5 bg-[#4a4e52] rounded-full animate-bounce"></span>
                                    <span className="w-1.5 h-1.5 bg-[#4a4e52] rounded-full animate-bounce delay-150"></span>
                                    <span className="w-1.5 h-1.5 bg-[#4a4e52] rounded-full animate-bounce delay-300"></span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={chatMessagesEndRef} />
                </div>

                {/* Input Box */}
                <form className="chat-input-area p-[15px] bg-[#fcfbf7] border-t border-[#e8e3d5] flex gap-3 z-10" onSubmit={onSubmit}>
                    <input 
                        type="text" 
                        className="flex-1 py-3 px-4 bg-[#f4f1ea] border border-[#e8e3d5] rounded text-sm focus:border-[#c5a059] focus:bg-white focus:outline-none"
                        placeholder="Inquire about case, contradictions, or timeline facts..." 
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                    />
                    <button type="submit" className="btn-chat-submit bg-[#2a1b12] border border-[#c5a059] text-[#dfb86c] w-11 h-11 rounded flex items-center justify-center text-base hover:bg-[#3d2a1d] hover:text-white transition-colors cursor-pointer">
                        <i className="fa-solid fa-paper-plane"></i>
                    </button>
                </form>

            </div>
        </div>
    );
}
