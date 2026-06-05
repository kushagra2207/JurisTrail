export default function CaseCard({ caseItem, onClick, onEdit, onDelete }) {
    return (
        <div 
            className="case-card bg-[#fcfbf7] border border-[#e8e3d5] border-t-4 border-t-[#2a1b12] rounded p-[22px] shadow-sm flex flex-col gap-3 hover:-translate-y-1 hover:shadow-lg hover:border-t-[#c5a059] transition-all cursor-pointer"
            onClick={onClick}
        >
            <div className="case-card-header flex justify-between items-start">
                <span className="docket-no text-[11px] font-semibold text-[#aa8643] tracking-wide">{caseItem.docket}</span>
                <div className="flex items-center gap-2">
                    {caseItem.contradictionsCount > 0 ? (
                        <span className="status-badge alert bg-[#fdf2f2] text-[#8b0000] border border-[#f5c2c2] text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">
                            <i className="fa-solid fa-triangle-exclamation mr-1"></i> {caseItem.contradictionsCount} Conflicts
                        </span>
                    ) : (
                        <span className="status-badge active bg-[#eef5f9] text-[#0b3c5d] border border-sky-950/20 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">Secured</span>
                    )}
                    <div className="flex gap-1 ml-1">
                        <button 
                            className="p-1 text-xs text-[#4a4e52] hover:text-[#aa8643] hover:bg-[#c5a059]/10 rounded cursor-pointer transition-colors"
                            title="Edit Case"
                            onClick={(e) => { e.stopPropagation(); onEdit(caseItem); }}
                        >
                            <i className="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button 
                            className="p-1 text-xs text-[#4a4e52] hover:text-[#8b0000] hover:bg-[#8b0000]/10 rounded cursor-pointer transition-colors"
                            title="Delete Case"
                            onClick={(e) => { e.stopPropagation(); onDelete(caseItem.id); }}
                        >
                            <i className="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>
            </div>
            <h2 className="text-base font-heading font-bold text-[#190f0a]">{caseItem.title}</h2>
            <div className="court-name text-[11px] text-[#4a4e52] font-semibold flex items-center gap-1.5">
                <i className="fa-solid fa-gavel text-xs"></i> {caseItem.court}
            </div>
            <p className="case-desc text-xs text-[#4a4e52] leading-relaxed line-clamp-3">{caseItem.desc}</p>
            <div className="case-card-footer flex justify-between items-center pt-3 border-t border-[#f4f1ea] mt-auto">
                <span className="doc-count text-[11px] text-[#4a4e52] flex items-center gap-1.5"><i className="fa-solid fa-file-invoice"></i> {caseItem.documentsCount} Files</span>
                <span className="doc-count text-[11px] text-[#4a4e52] flex items-center gap-1.5"><i className="fa-solid fa-clock"></i> {caseItem.lastUpdated}</span>
            </div>
        </div>
    );
}
