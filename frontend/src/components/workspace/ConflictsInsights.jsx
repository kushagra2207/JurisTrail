export default function ConflictsInsights({ insights, onRefresh, isRefreshing }) {
    return (
        <div className="tab-content active h-full p-6 overflow-y-auto">
            <div className="insights-container bg-white border border-[#e8e3d5] rounded p-6 shadow-sm">
                <div className="timeline-header border-b border-[#e8e3d5] pb-3 mb-6 flex justify-between items-start">
                    <div>
                        <h4 className="text-[14px] font-heading font-bold text-[#190f0a]">Contradiction & Discrepancy Register</h4>
                        <p className="text-xs text-[#4a4e52]">Discovered conflicts in timestamps, locations, and statement facts analyzed by the agents.</p>
                    </div>
                    {onRefresh && (
                        <button 
                            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider bg-[#2a1b12] text-[#dfb86c] border border-[#c5a059] rounded hover:bg-[#3d2a1d] hover:text-white cursor-pointer transition-all disabled:opacity-50"
                            onClick={onRefresh}
                            disabled={isRefreshing}
                        >
                            <i className={`fa-solid fa-arrows-rotate ${isRefreshing ? 'fa-spin' : ''}`}></i> {isRefreshing ? 'Refreshing...' : 'Refresh'}
                        </button>
                    )}
                </div>
                <div className="insights-list flex flex-col gap-5">
                    {insights.length === 0 ? (
                        <div className="text-center py-5 text-[#4a4e52] italic text-xs">
                            {isRefreshing ? 'Loading investigation data...' : 'No conflicts or investigative reports created. Upload documents or click Refresh.'}
                        </div>
                    ) : (
                        insights.map(ins => (
                            <div className={`insight-item bg-[#fcfbf7] rounded border border-[#e8e3d5] shadow-sm overflow-hidden ${ins.type === 'contradiction' ? 'border-l-4 border-l-[#8b0000]' : 'border-l-4 border-l-[#1b4332]'}`} key={ins.id}>
                                <div className="insight-item-header px-5 py-3 bg-[#190f0a]/2 flex justify-between items-center border-b border-[#f4f1ea]">
                                    <span className={`insight-label flex items-center gap-1.5 text-[11px] uppercase font-bold tracking-wider ${ins.type === 'contradiction' ? 'text-[#8b0000]' : 'text-[#1b4332]'}`}>
                                        <i className="fa-solid fa-triangle-exclamation"></i> {ins.type}
                                    </span>
                                    <span className="insight-status text-[10px] uppercase bg-[#d1d5db] text-[#190f0a] px-2 py-0.5 rounded font-bold">{ins.status}</span>
                                </div>
                                <div className="insight-body p-5 text-xs text-[#4a4e52] leading-relaxed">
                                    <h4 className="text-sm font-heading font-bold text-[#190f0a] mb-2">{ins.title}</h4>
                                    <p className="mb-2"><strong className="text-[#190f0a]">Summary:</strong> {ins.summary}</p>
                                    <p className="mb-4"><strong className="text-[#190f0a]">Analysis:</strong> {ins.details}</p>
                                    
                                    <div className="insight-evidence-grid grid grid-cols-1 md:grid-cols-2 gap-4 pt-3.5 border-t border-dashed border-[#e8e3d5]">
                                        <div className="evidence-box bg-[#f4f1ea] border border-[#e8e3d5] rounded p-3 border-l-3 border-l-[#4a4e52]">
                                            <div className="evidence-title text-[10px] uppercase font-bold text-[#4a4e52] mb-1.5 flex justify-between">
                                                <span>Assertion A</span>
                                                <span className="evidence-source text-[#aa8643]">{ins.evidenceA.source}</span>
                                            </div>
                                            <div className="evidence-text italic text-[#2a1b12]">"{ins.evidenceA.text}"</div>
                                        </div>
                                        <div className="evidence-box bg-[#f4f1ea] border border-[#e8e3d5] rounded p-3 border-l-3 border-l-[#8b0000]">
                                            <div className="evidence-title text-[10px] uppercase font-bold text-[#4a4e52] mb-1.5 flex justify-between">
                                                <span>Assertion B</span>
                                                <span className="evidence-source text-[#aa8643]">{ins.evidenceB.source}</span>
                                            </div>
                                            <div className="evidence-text italic text-[#2a1b12]">"{ins.evidenceB.text}"</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
