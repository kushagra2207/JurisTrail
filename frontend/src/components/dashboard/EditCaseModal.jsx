export default function EditCaseModal({
    isOpen,
    onClose,
    onSubmit,
    editCaseTitle,
    setEditCaseTitle,
    editCaseDocket,
    setEditCaseDocket,
    editCaseCourt,
    setEditCaseCourt,
    editCaseDesc,
    setEditCaseDesc
}) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay fixed inset-0 bg-[#190f0a]/70 z-50 flex items-center justify-center backdrop-blur-xs animate-fadeIn">
            <div className="modal-card bg-[#fcfbf7] border border-[#c5a059] shadow-2xl w-full max-w-[500px] rounded-md overflow-hidden animate-scaleUp">
                <div className="modal-header bg-[#2a1b12] border-b-2 border-[#c5a059] px-6 py-4 text-white flex justify-between items-center">
                    <h2 className="text-base font-heading font-bold">Edit Legal Case Archive</h2>
                    <button className="btn-close-modal bg-transparent border-none text-[#e8e3d5] cursor-pointer text-lg hover:text-[#dfb86c]" onClick={onClose}>
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <form className="p-6 flex flex-col gap-4 text-xs" onSubmit={onSubmit}>
                    <div className="form-group flex flex-col gap-1.5">
                        <label className="block text-[11px] uppercase font-bold tracking-wider text-[#190f0a]">Case Title (e.g. State of UP v. Rahul Mathur)</label>
                        <input 
                            type="text" 
                            className="w-full py-2.5 px-3 bg-[#f4f1ea] border border-[#e8e3d5] rounded focus:border-[#c5a059] focus:bg-white focus:outline-none"
                            required 
                            value={editCaseTitle}
                            onChange={e => setEditCaseTitle(e.target.value)}
                            placeholder="Enter primary litigants name..." 
                        />
                    </div>
                    <div className="form-group flex flex-col gap-1.5">
                        <label className="block text-[11px] uppercase font-bold tracking-wider text-[#190f0a]">Docket / Enrollment ID / Court Filing No.</label>
                        <input 
                            type="text" 
                            className="w-full py-2.5 px-3 bg-[#f4f1ea] border border-[#e8e3d5] rounded focus:border-[#c5a059] focus:bg-white focus:outline-none"
                            required 
                            value={editCaseDocket}
                            onChange={e => setEditCaseDocket(e.target.value)}
                            placeholder="e.g. SLP (Crl.) No. 3412/2026" 
                        />
                    </div>
                    <div className="form-group flex flex-col gap-1.5">
                        <label className="block text-[11px] uppercase font-bold tracking-wider text-[#190f0a]">Filing Court / Legal Jurisdiction</label>
                        <select 
                            className="w-full py-2.5 px-3 bg-[#f4f1ea] border border-[#e8e3d5] rounded focus:border-[#c5a059] focus:bg-white focus:outline-none cursor-pointer"
                            value={editCaseCourt}
                            onChange={e => setEditCaseCourt(e.target.value)}
                        >
                            <option value="Supreme Court of India">Supreme Court of India</option>
                            <option value="Delhi High Court">Delhi High Court</option>
                            <option value="Bombay High Court">Bombay High Court</option>
                            <option value="Karnataka High Court">Karnataka High Court</option>
                            <option value="Allahabad High Court">Allahabad High Court</option>
                            <option value="District Court of Delhi">District Court of Delhi</option>
                        </select>
                    </div>
                    <div className="form-group flex flex-col gap-1.5">
                        <label className="block text-[11px] uppercase font-bold tracking-wider text-[#190f0a]">Case Briefing / Scope of Investigation</label>
                        <textarea 
                            className="w-full py-2.5 px-3 bg-[#f4f1ea] border border-[#e8e3d5] rounded focus:border-[#c5a059] focus:bg-white focus:outline-none resize-none"
                            rows="4" 
                            value={editCaseDesc}
                            onChange={e => setEditCaseDesc(e.target.value)}
                            placeholder="Brief outline of the litigation parameters and key suspect names..."
                        />
                    </div>
                    <div className="modal-actions flex justify-end gap-3 mt-4 pt-4 border-t border-[#e8e3d5]">
                        <button type="button" className="btn btn-secondary bg-[#d1d5db] text-[#190f0a] px-4 py-2 hover:bg-[#4a4e52] hover:text-white rounded font-semibold text-xs cursor-pointer" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-gold bg-[#2a1b12] text-[#dfb86c] border border-[#c5a059] px-4 py-2 hover:bg-[#3d2a1d] hover:text-white rounded font-semibold text-xs cursor-pointer">Update File</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
