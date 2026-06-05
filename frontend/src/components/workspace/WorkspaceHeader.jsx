export default function WorkspaceHeader({ selectedCase, onBack }) {
    return (
        <header className="workspace-header bg-[#2a1b12] border-b-2 border-[#c5a059] flex justify-between items-center px-6 h-[60px] text-white">
            <div className="workspace-nav-left flex items-center gap-5">
                <button 
                    className="btn-back bg-transparent border border-white/20 text-white px-[14px] py-[6px] rounded text-xs hover:bg-white/10 hover:border-[#c5a059] cursor-pointer" 
                    onClick={onBack}
                >
                    <i className="fa-solid fa-arrow-left-long mr-1.5"></i> Dashboard
                </button>
                <div className="workspace-case-meta flex items-center gap-3">
                    <h2 className="text-base font-heading font-bold text-[#fcfbf7]">{selectedCase.title}</h2>
                    <span className="court-tag text-[10px] px-2 py-0.5 rounded bg-[#3d2a1d] text-[#dfb86c] border border-[#c5a059]/30 font-medium">{selectedCase.court}</span>
                    <span className="docket-tag text-[10px] px-2 py-0.5 rounded bg-white/10 text-[#d1d5db] font-medium">{selectedCase.docket}</span>
                </div>
            </div>
            <div className="workspace-nav-right">
                <div className="engine-badge text-[11px] text-[#dfb86c] font-semibold flex items-center gap-1.5">
                    <i className="fa-solid fa-brain"></i> Hindsight Memory Layer Active
                </div>
            </div>
        </header>
    );
}
