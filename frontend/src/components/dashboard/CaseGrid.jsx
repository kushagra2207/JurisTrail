import CaseCard from './CaseCard';

export default function CaseGrid({ cases, searchQuery, onCaseClick, onEdit, onDelete }) {
    const filteredCases = cases.filter(c => 
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.docket.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <section className="cases-area flex-1 p-[30px] overflow-y-auto">
            <div className="cases-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCases.map(c => (
                    <CaseCard 
                        key={c.id} 
                        caseItem={c} 
                        onClick={() => onCaseClick(c.id)} 
                        onEdit={onEdit}
                        onDelete={onDelete}
                    />
                ))}
                {filteredCases.length === 0 && (
                    <div className="text-center py-20 text-[#4a4e52] italic text-sm col-span-full">
                        No litigation archives found matching your query.
                    </div>
                )}
            </div>
        </section>
    );
}
