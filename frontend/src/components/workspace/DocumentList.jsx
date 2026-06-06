import DocumentCard from './DocumentCard';

export default function DocumentList({ documents, selectedDocument, onSelectDocument, onRetryDocument, onDeleteDocument }) {
    return (
        <>
            <div className="section-title text-[12px] uppercase font-heading font-bold text-[#4a4e52] mb-3.5 tracking-wider">Ingested Case Documents</div>
            <div className="document-list flex flex-col gap-2.5 mb-5">
                {documents.length === 0 ? (
                    <div className="text-center py-5 text-[#4a4e52] italic text-xs">
                        No evidence documents ingested yet. Drop files above.
                    </div>
                ) : (
                    documents.map(doc => (
                        <DocumentCard 
                            key={doc.id}
                            doc={doc}
                            isSelected={selectedDocument?.id === doc.id}
                            onSelect={() => onSelectDocument(doc)}
                            onRetry={onRetryDocument}
                            onDelete={onDeleteDocument}
                        />
                    ))
                )}
            </div>
        </>
    );
}
