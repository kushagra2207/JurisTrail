export default function CaseTimeline({ timeline, documents, onSourceClick, onRefresh, isRefreshing }) {
    return (
        <div className="tab-content active h-full p-6 overflow-y-auto">
            <div className="timeline-container bg-white border border-[#e8e3d5] rounded p-6 shadow-sm">
                <div className="timeline-header border-b border-[#e8e3d5] pb-3 mb-6 flex justify-between items-start">
                    <div>
                        <h4 className="text-[14px] font-heading font-bold text-[#190f0a]">Unified Chronology of Events</h4>
                        <p className="text-xs text-[#4a4e52]">Evolving timeline compiled by extraction of verified facts across all files.</p>
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
                <div className="timeline-flow relative pl-[30px] before:content-[''] before:absolute before:left-2 before:top-1 before:bottom-1 before:width-[2px] before:w-[2px] before:bg-[#c5a059] flex flex-col gap-6">
                    {timeline.length === 0 ? (
                        <div className="text-center py-5 text-[#4a4e52] italic text-xs">
                            {isRefreshing ? 'Loading timeline data...' : 'No chronological events found. Upload documents or click Refresh to check for updates.'}
                        </div>
                    ) : (
                        [...timeline]
                            .sort((a, b) => {
                                const dateA = a.timestamp ? new Date(a.timestamp) : new Date(0);
                                const dateB = b.timestamp ? new Date(b.timestamp) : new Date(0);
                                return dateA - dateB;
                            })
                            .map(evt => (
                                <div className={`timeline-node relative before:content-[''] before:absolute before:-left-[26.5px] before:top-1 before:w-[10px] before:h-[10px] before:rounded-full before:border-2 before:border-[#c5a059] before:z-10 ${evt.status === 'conflict' ? 'before:bg-[#8b0000] before:border-[#8b0000] before:shadow-[0_0_8px_rgba(139,0,0,0.6)]' : evt.status === 'support' ? 'before:bg-[#1b4332] before:border-[#1b4332]' : 'before:bg-[#190f0a]'}`} key={evt.id}>
                                    <div className="timeline-time font-heading font-bold text-[11px] text-[#aa8643] mb-1.5 flex items-center gap-2">
                                        {evt.displayTime}
                                        <span className="time-precision bg-[#d1d5db] text-[#190f0a] text-[9px] uppercase font-bold px-1.5 py-0.5 rounded">{evt.precision}</span>
                                    </div>
                                    <div className="timeline-card bg-[#fcfbf7] border border-[#e8e3d5] rounded p-4 shadow-sm">
                                        <h5 className="text-[13px] font-heading font-bold text-[#190f0a] mb-1">{evt.title}</h5>
                                        <p className="text-xs text-[#4a4e52] leading-relaxed">{evt.description}</p>
                                        
                                        {evt.status === 'conflict' && (
                                            <span className="timeline-alert-tag inline-flex items-center gap-1.5 bg-[#fdf2f2] text-[#8b0000] border border-[#f5c2c2] px-2 py-0.5 rounded text-[9px] font-bold mt-2 uppercase">
                                                <i className="fa-solid fa-triangle-exclamation"></i> Discrepancy Found
                                            </span>
                                        )}
                                        {evt.status === 'support' && (
                                            <span className="timeline-alert-tag inline-flex items-center gap-1.5 bg-[#edf7ed] text-[#1b4332] border border-[#c3e6cb] px-2 py-0.5 rounded text-[9px] font-bold mt-2 uppercase">
                                                <i className="fa-solid fa-check-double"></i> Supported Fact
                                            </span>
                                        )}
                                        
                                        <div className="timeline-source flex justify-between items-center mt-3 pt-2.5 border-t border-dashed border-[#f4f1ea] text-[10px] text-[#4a4e52]">
                                            <span><i className="fa-solid fa-paperclip mr-1"></i> Source File:</span>
                                            <a href="#" className="source-link font-semibold text-[#aa8643]" onClick={(e) => {
                                                e.preventDefault();
                                                const foundDoc = documents.find(d => d.name === evt.sourceDoc);
                                                if (foundDoc) onSourceClick(foundDoc);
                                            }}>
                                                {evt.sourceDoc}
                                            </a>
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
