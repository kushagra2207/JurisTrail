export default function DashboardHeader({ username, onLogout }) {
    return (
        <header className="app-header bg-[#190f0a] border-b-2 border-[#c5a059] flex justify-between items-center px-[30px] h-[70px] text-[#fcfbf7] shadow-xl z-20">
            <div className="header-logo flex items-center gap-4">
                <i className="fa-solid fa-scale-balanced logo-icon text-2xl text-[#c5a059]"></i>
                <div className="logo-text flex flex-col">
                    <span className="logo-title font-heading text-[20px] font-bold tracking-wider leading-none">JURIS&bull;TRAIL</span>
                    <span className="logo-subtitle text-[9px] tracking-widest text-[#d1d5db] font-light">INDIAN LEGAL COGNITIVE SYSTEM</span>
                </div>
            </div>
            <div className="header-user flex items-center gap-5">
                <span className="court-badge bg-[#3d2a1d] border border-[#c5a059] px-3 py-1 rounded text-[11px] font-heading font-semibold tracking-wide text-[#dfb86c]">
                    <i className="fa-solid fa-gavel mr-1"></i> SUPREME COURT OF INDIA
                </span>
                <span className="user-name text-xs font-semibold text-[#e8e3d5]">{username}</span>
                <button 
                    className="btn-logout bg-transparent border-none text-[#d1d5db] cursor-pointer text-lg hover:text-[#8b0000] transition-colors" 
                    onClick={onLogout} 
                    title="Log out from session"
                >
                    <i className="fa-solid fa-power-off"></i>
                </button>
            </div>
        </header>
    );
}
