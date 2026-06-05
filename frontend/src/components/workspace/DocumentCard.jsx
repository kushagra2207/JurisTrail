export default function DocumentCard({ doc, isSelected, onSelect, onRetry }) {
    const statusConfig = {
        pending: { label: 'Pending', color: 'bg-[#d97706] text-white', icon: 'fa-clock', pulse: false },
        processing: { label: 'Processing', color: 'bg-[#2563eb] text-white', icon: 'fa-gear fa-spin', pulse: true },
        completed: { label: 'Ready', color: 'bg-[#1b4332] text-white', icon: 'fa-check', pulse: false },
        failed: { label: 'Failed', color: 'bg-[#8b0000] text-white', icon: 'fa-xmark', pulse: false },
    };
    const status = statusConfig[doc.processingStatus] || statusConfig.completed;

    return (
        <div 
            className={`document-card bg-[#f4f1ea] border rounded px-4 py-3 flex items-center justify-between gap-4 cursor-pointer hover:border-[#c5a059] hover:bg-[#fcfbf7] transition-all ${isSelected ? 'active border-[#c5a059] bg-[#fcfbf7] shadow' : 'border-[#e8e3d5]'}`}
            onClick={onSelect}
        >
            <div className="doc-info flex items-center gap-3 overflow-hidden">
                <i className="fa-solid fa-file-lines doc-file-icon text-lg text-[#4a4e52]"></i>
                <div className="doc-meta overflow-hidden">
                    <div className="doc-name text-[13px] font-semibold text-[#190f0a] truncate" title={doc.name}>{doc.name}</div>
                    <div className="doc-details text-[10px] text-[#4a4e52] flex items-center gap-2">
                        <span>{doc.size}</span>
                        <span>&bull;</span>
                        <span>Parsed: {doc.uploadedAt}</span>
                        <span>&bull;</span>
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${status.color} ${status.pulse ? 'animate-pulse' : ''}`}>
                            <i className={`fa-solid ${status.icon} text-[8px]`}></i> {status.label}
                        </span>
                    </div>
                </div>
            </div>
            <div className="doc-actions flex items-center gap-1">
                {doc.processingStatus === 'failed' && onRetry && (
                    <button 
                        className="btn-icon p-1 text-[#8b0000] hover:text-white hover:bg-[#8b0000] rounded text-[10px]" 
                        title="Retry Processing" 
                        onClick={(e) => { e.stopPropagation(); onRetry(doc); }}
                    >
                        <i className="fa-solid fa-rotate-right"></i>
                    </button>
                )}
                <button 
                    className="btn-icon p-1 text-[#4a4e52] hover:text-[#aa8643] hover:bg-[#c5a059]/10 rounded" 
                    title="View Extracted Memories" 
                    onClick={(e) => { e.stopPropagation(); onSelect(); }}
                >
                    <i className="fa-solid fa-brain"></i>
                </button>
            </div>
        </div>
    );
}
