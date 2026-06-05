export default function UploadZone({ 
    fileInputRef, 
    onTriggerClick, 
    onFileSelect, 
    onDragOver, 
    onDragLeave, 
    onDrop, 
    uploadProgress 
}) {
    return (
        <>
            <div 
                className="upload-zone border-2 border-dashed border-[#c5a059] bg-[#f4f1ea] rounded p-6 text-center cursor-pointer hover:bg-[#e8e3d5] hover:border-[#2a1b12] transition-colors mb-5"
                onClick={onTriggerClick}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
            >
                <i className="fa-solid fa-cloud-arrow-up upload-icon text-3xl text-[#c5a059] mb-2"></i>
                <h4 className="text-xs uppercase font-bold text-[#190f0a] mb-1">File Ingestion Portal</h4>
                <p className="text-[11px] text-[#4a4e52]">Drag and drop PDF, Word, Court filings, or Witness statements, or <span className="text-[#aa8643] underline font-bold">browse locally</span></p>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={onFileSelect} 
                    accept=".pdf,.txt,.doc,.docx,.csv,.json"
                />
            </div>

            {/* Progress bar */}
            {uploadProgress && (
                <div className="upload-progress-container bg-[#121e36] border border-[#c5a059] text-white p-3 rounded mb-5 animate-slideDown">
                    <div className="progress-info flex justify-between text-[11px] mb-1.5">
                        <span className="truncate max-w-[80%]">{uploadProgress.name} — {uploadProgress.status}</span>
                        <span>{uploadProgress.percent}%</span>
                    </div>
                    <div className="progress-bar-track bg-white/10 h-1 rounded-full overflow-hidden">
                        <div className="progress-bar-fill bg-[#c5a059] h-full transition-all duration-100" style={{ width: `${uploadProgress.percent}%` }}></div>
                    </div>
                </div>
            )}
        </>
    );
}
