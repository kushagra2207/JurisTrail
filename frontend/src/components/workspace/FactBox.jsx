export default function FactBox({ selectedDocument, onClose }) {
    if (!selectedDocument) return null;

    return (
        <div className="fact-box-panel bg-white border border-[#c5a059] rounded p-4 shadow animate-fadeIn">
            <div className="fact-box-header flex justify-between items-center border-b border-[#e8e3d5] pb-2 mb-3">
                <h4 className="text-[11px] text-[#2a1b12] uppercase font-heading font-semibold tracking-wide">
                    <i className="fa-solid fa-diagram-project mr-1.5"></i> Extracted Facts & Entities
                </h4>
                <button className="btn-close-facts bg-transparent border-none text-[#4a4e52] cursor-pointer hover:text-[#190f0a]" onClick={onClose}>
                    <i className="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div className="fact-box-content text-xs">
                <div className="selected-doc-title font-semibold text-xs text-[#aa8643] mb-3">{selectedDocument.name}</div>
                
                <div className="extracted-sub-section mb-3.5">
                    <h5 className="text-[10px] uppercase font-bold text-[#4a4e52] mb-1.5">Resolved Entities</h5>
                    <div className="entities-tags flex flex-wrap gap-1.5">
                        {selectedDocument.entities && selectedDocument.entities.length > 0 ? (
                            selectedDocument.entities.map((ent, idx) => (
                                <span 
                                    key={idx} 
                                    className={`entity-tag bg-[#f4f1ea] border border-[#e8e3d5] px-2 py-0.5 rounded text-[10px] font-medium text-[#190f0a] ${ent.type === 'person' ? 'border-l-2 border-l-[#005f73]' : ent.type === 'location' ? 'border-l-2 border-l-[#9b2226]' : 'border-l-2 border-l-[#ca6702]'}`} 
                                    title={ent.desc}
                                >
                                    {ent.name} ({ent.type})
                                </span>
                            ))
                        ) : (
                            <span className="text-[11px] text-[#4a4e52]">No resolved entities.</span>
                        )}
                    </div>
                </div>

                <div className="extracted-sub-section">
                    <h5 className="text-[10px] uppercase font-bold text-[#4a4e52] mb-1.5">Factual Assertions</h5>
                    <ul className="assertions-list flex flex-col gap-1.5 list-none">
                        {selectedDocument.assertions && selectedDocument.assertions.length > 0 ? (
                            selectedDocument.assertions.map((ast, idx) => (
                                <li key={idx} className="bg-[#f4f1ea] px-2.5 py-1.5 rounded border-l-3 border-[#4a4e52]">
                                    {ast}
                                </li>
                            ))
                        ) : (
                            <li className="text-[11px] text-[#4a4e52]">No assertions extracted.</li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
}
