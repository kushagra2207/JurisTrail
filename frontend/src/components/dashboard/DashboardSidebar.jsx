export default function DashboardSidebar({ searchQuery, setSearchQuery, cases }) {
    const totalFacts = cases.reduce((sum, c) => sum + (c.documentsCount * 3), 0);
    const totalConflicts = cases.reduce((sum, c) => sum + c.contradictionsCount, 0);
    const conflictsCount = cases.filter(c => c.contradictionsCount > 0).length;

    return (
        <aside className="dashboard-sidebar w-[300px] bg-[#f4f1ea] border-r border-[#e8e3d5] p-6 flex flex-col gap-5 overflow-y-auto">
            
            <div className="sidebar-card bg-[#fcfbf7] border border-[#e8e3d5] rounded p-5 shadow-sm">
                <h3 className="text-xs uppercase font-heading tracking-wider text-[#2a1b12] pb-2 border-b border-[#f4f1ea] mb-4">Case Repository</h3>
                <div className="search-bar relative mb-4">
                    <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-[#4a4e52]"></i>
                    <input 
                        type="text" 
                        className="w-full py-2 pr-2 pl-[32px] bg-[#f4f1ea] border border-[#e8e3d5] rounded text-xs focus:border-[#c5a059] focus:outline-none focus:bg-white"
                        placeholder="Search Docket No, Title..." 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <ul className="filter-list flex flex-col gap-2 list-none">
                    <li className="active">
                        <button className="flex justify-between items-center text-xs font-semibold py-2 px-3 rounded text-[#190f0a] bg-[#f4f1ea] border-l-3 border-[#c5a059] cursor-pointer">
                            <span><i className="fa-solid fa-folder-open mr-2"></i> All Cases</span>
                            <span className="badge bg-[#4a4e52] text-white px-2 py-0.5 rounded-full text-[10px]">{cases.length}</span>
                        </button>
                    </li>
                    <li>
                        <button className="flex justify-between items-center text-xs font-semibold py-2 px-3 rounded text-[#4a4e52] hover:bg-[#f4f1ea] hover:text-[#190f0a] cursor-pointer">
                            <span><i className="fa-solid fa-circle-exclamation mr-2 text-[#8b0000]"></i> Inconsistencies Found</span>
                            <span className="badge bg-[#8b0000] text-white px-2 py-0.5 rounded-full text-[10px]">{conflictsCount}</span>
                        </button>
                    </li>
                    <li>
                        <button className="flex justify-between items-center text-xs font-semibold py-2 px-3 rounded text-[#4a4e52] hover:bg-[#f4f1ea] hover:text-[#190f0a] cursor-pointer">
                            <span><i className="fa-solid fa-clock mr-2"></i> Recently Ingested</span>
                            <span className="badge bg-[#4a4e52] text-white px-2 py-0.5 rounded-full text-[10px]">{cases.length}</span>
                        </button>
                    </li>
                </ul>
            </div>

            <div className="sidebar-card bg-[#fcfbf7] border border-[#e8e3d5] rounded p-5 shadow-sm">
                <h3 className="text-xs uppercase font-heading tracking-wider text-[#2a1b12] pb-2 border-b border-[#f4f1ea] mb-4">Hindsight Engine</h3>
                <div className="status-indicator flex items-center gap-2 text-xs text-[#4a4e52] font-semibold mb-4">
                    <span className="pulse-dot"></span>
                    <span>Cognitive Analysis Online</span>
                </div>
                <div className="stats-grid grid grid-cols-2 gap-3">
                    <div className="stat-box bg-[#f4f1ea] border border-[#e8e3d5] rounded p-3 text-center">
                        <span className="stat-num block font-heading text-xl font-bold text-[#aa8643]">{totalFacts}</span>
                        <span className="stat-label text-[10px] uppercase text-[#4a4e52] font-semibold">Facts</span>
                    </div>
                    <div className="stat-box bg-[#f4f1ea] border border-[#e8e3d5] rounded p-3 text-center">
                        <span className="stat-num block font-heading text-xl font-bold text-[#aa8643]">{totalConflicts}</span>
                        <span className="stat-label text-[10px] uppercase text-[#4a4e52] font-semibold">Conflicts</span>
                    </div>
                </div>
            </div>

        </aside>
    );
}
