import { useState, useEffect, useRef, useCallback } from 'react';

// API Client and Helper Functions
import { 
    api, 
    generateId, 
    getFormattedDate
} from './api/api';

// Auth Components
import AuthBanner from './components/auth/AuthBanner';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';

// Dashboard Components
import DashboardHeader from './components/dashboard/DashboardHeader';
import DashboardSidebar from './components/dashboard/DashboardSidebar';
import CaseGrid from './components/dashboard/CaseGrid';
import CreateCaseModal from './components/dashboard/CreateCaseModal';
import EditCaseModal from './components/dashboard/EditCaseModal';

// Workspace Components
import WorkspaceHeader from './components/workspace/WorkspaceHeader';
import UploadZone from './components/workspace/UploadZone';
import DocumentList from './components/workspace/DocumentList';
import FactBox from './components/workspace/FactBox';
import ChatAssistant from './components/workspace/ChatAssistant';
import CaseTimeline from './components/workspace/CaseTimeline';
import ConflictsInsights from './components/workspace/ConflictsInsights';

// ==========================================================================
// CORE APP COMPONENT
// ==========================================================================
export default function App() {
    // Navigation / General State
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('juristrail_user');
        if (storedUser) {
            try {
                return JSON.parse(storedUser);
            } catch (error) {
                console.error("Error restoring user session:", error);
                return null;
            }
        }
        return null;
    });

    const [view, setView] = useState(() => {
        const token = localStorage.getItem('juristrail_token');
        const storedUser = localStorage.getItem('juristrail_user');
        return (token && storedUser) ? 'dashboard' : 'auth';
    });

    const [authTab, setAuthTab] = useState('login'); // 'login' | 'register'
    const [authError, setAuthError] = useState(null);

    // Form inputs
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [regUsername, setRegUsername] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regBarId, setRegBarId] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regConfirmPassword, setRegConfirmPassword] = useState('');

    // Dashboard State
    const [cases, setCases] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newCaseTitle, setNewCaseTitle] = useState('');
    const [newCaseDocket, setNewCaseDocket] = useState('');
    const [newCaseCourt, setNewCaseCourt] = useState('Supreme Court of India');
    const [newCaseDesc, setNewCaseDesc] = useState('');

    // Edit Case Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingCase, setEditingCase] = useState(null);
    const [editCaseTitle, setEditCaseTitle] = useState('');
    const [editCaseDocket, setEditCaseDocket] = useState('');
    const [editCaseCourt, setEditCaseCourt] = useState('Supreme Court of India');
    const [editCaseDesc, setEditCaseDesc] = useState('');

    // Workspace State
    const [selectedCase, setSelectedCase] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [timeline, setTimeline] = useState([]);
    const [insights, setInsights] = useState([]);
    const [workspaceTab, setWorkspaceTab] = useState('chat'); // 'chat' | 'timeline' | 'insights'
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(null); // { name, percent, status }
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fileInputRef = useRef(null);
    const chatMessagesEndRef = useRef(null);

    // Scroll to bottom of chat when messages change
    useEffect(() => {
        if (chatMessagesEndRef.current) {
            chatMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatMessages, isTyping]);

    const loadDashboardData = useCallback(async () => {
        try {
            const data = await api.cases.list();
            setCases(data);
        } catch (error) {
            console.error("Failed to retrieve cases from backend database:", error);
            setAuthError("Failed to connect to database. Make sure your server is online.");
        }
    }, []);

    // Fetch dashboard data
    useEffect(() => {
        if (view === 'dashboard' && user) {
            loadDashboardData();
        }
    }, [view, user, loadDashboardData]);

    // ==========================================================================
    // AUTH ACTIONS
    // ==========================================================================
    const handleLogin = async (e) => {
        e.preventDefault();
        setAuthError(null);
        try {
            const data = await api.auth.login(loginEmail, loginPassword);
            localStorage.setItem('juristrail_token', data.token);
            localStorage.setItem('juristrail_user', JSON.stringify(data.user));
            setUser(data.user);
            setView('dashboard');
        } catch (error) {
            setAuthError(error.message || 'Login failed.');
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setAuthError(null);
        if (regPassword !== regConfirmPassword) {
            setAuthError("Passwords do not match.");
            return;
        }
        try {
            const data = await api.auth.register(regUsername, regEmail, regPassword, regConfirmPassword, regBarId);
            localStorage.setItem('juristrail_token', data.token);
            localStorage.setItem('juristrail_user', JSON.stringify(data.user));
            setUser(data.user);
            setView('dashboard');
        } catch (error) {
            setAuthError(error.message || 'Registration failed.');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('juristrail_token');
        localStorage.removeItem('juristrail_user');
        setUser(null);
        setView('auth');
        // Reset forms
        setLoginEmail('');
        setLoginPassword('');
        setRegUsername('');
        setRegEmail('');
        setRegBarId('');
        setRegPassword('');
        setRegConfirmPassword('');
        setAuthError(null);
    };

    const navigateToDashboard = () => {
        setView('dashboard');
    };

    // ==========================================================================
    // CASE WORKSPACE ACTIONS
    // ==========================================================================
    const openCaseWorkspace = async (caseId) => {
        const c = cases.find(item => item.id === caseId);
        setSelectedCase(c);
        setSelectedDocument(null);
        setWorkspaceTab('chat');
        setChatMessages([]);

        try {
            const docsData = await api.cases.getDocuments(caseId);
            const timelineRes = await api.cases.getTimeline(caseId);
            const insightsRes = await api.cases.getInsights(caseId);

            setDocuments(docsData);
            // Handle both old (array) and new ({ data, error }) response formats
            setTimeline(Array.isArray(timelineRes) ? timelineRes : (timelineRes.data || []));
            setInsights(Array.isArray(insightsRes) ? insightsRes : (insightsRes.data || []));
            setView('workspace');
        } catch (error) {
            console.error("API error fetching documents:", error);
            alert("Failed to load workspace data.");
        }
    };

    const handleCreateCase = async (e) => {
        e.preventDefault();
        const data = {
            title: newCaseTitle,
            docket: newCaseDocket,
            court: newCaseCourt,
            desc: newCaseDesc
        };

        try {
            const newCase = await api.cases.create(data);
            setCases(prev => [newCase, ...prev]);
            setIsCreateModalOpen(false);
            resetCreateCaseForm();
        } catch (error) {
            console.error("API error initializing case:", error);
            alert("Failed to create case.");
        }
    };

    const resetCreateCaseForm = () => {
        setNewCaseTitle('');
        setNewCaseDocket('');
        setNewCaseCourt('Supreme Court of India');
        setNewCaseDesc('');
    };

    const openEditCaseModal = (c) => {
        setEditingCase(c);
        setEditCaseTitle(c.title || '');
        setEditCaseDocket(c.docket || '');
        setEditCaseCourt(c.court || 'Supreme Court of India');
        setEditCaseDesc(c.desc || '');
        setIsEditModalOpen(true);
    };

    const handleEditCase = async (e) => {
        e.preventDefault();
        const data = {
            title: editCaseTitle,
            docket: editCaseDocket,
            court: editCaseCourt,
            desc: editCaseDesc
        };

        try {
            const updatedCase = await api.cases.update(editingCase.id, data);
            setCases(prev => prev.map(c => c.id === editingCase.id ? updatedCase : c));
            setIsEditModalOpen(false);
        } catch (error) {
            console.error("API error updating case:", error);
            alert("Failed to update case file.");
        }
    };

    const handleDeleteCase = async (caseId) => {
        if (!confirm("Are you sure you want to permanently delete this case file and all associated documents?")) {
            return;
        }

        try {
            await api.cases.delete(caseId);
            setCases(prev => prev.filter(c => c.id !== caseId));
        } catch (error) {
            console.error("API error deleting case:", error);
            alert("Failed to delete case file.");
        }
    };

    // ==========================================================================
    // DOCUMENT INGESTION FLOW
    // ==========================================================================
    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    const handleFileSelect = (e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            uploadFile(files[0]);
        }
    };

    const uploadFile = async (file) => {
        setUploadProgress({
            name: file.name,
            percent: 10,
            status: "Uploading document file..."
        });

        // Trigger real file upload API
        await finalizeFileIngestion(file);
    };

    const finalizeFileIngestion = async (file) => {
        const caseId = selectedCase.id;

        try {
            const formData = new FormData();
            formData.append('file', file);
            
            // Set intermediate progress status
            setUploadProgress({
                name: file.name,
                percent: 30,
                status: "Uploading to cloud storage..."
            });

            const uploadResult = await api.cases.uploadDocument(caseId, formData);
            const docId = uploadResult?.document?.id;
            
            if (!docId) {
                throw new Error('Upload succeeded but no document ID was returned.');
            }

            // Poll for pipeline completion
            setUploadProgress({
                name: file.name,
                percent: 50,
                status: "Processing with AI agents (Evidence → Timeline → Investigation)..."
            });

            // Poll document status until completed or failed
            let pollAttempts = 0;
            const maxPollAttempts = 60; // 3 minutes max (60 * 3s)
            let pipelineDone = false;

            while (pollAttempts < maxPollAttempts && !pipelineDone) {
                await new Promise(resolve => setTimeout(resolve, 3000)); // wait 3s
                pollAttempts++;

                try {
                    const statusResult = await api.cases.getDocumentStatus(caseId, docId);
                    const docStatus = statusResult.status;

                    if (docStatus === 'completed') {
                        pipelineDone = true;
                        setUploadProgress({
                            name: file.name,
                            percent: 90,
                            status: "Pipeline complete. Synchronizing data..."
                        });
                    } else if (docStatus === 'failed') {
                        const errorMsg = statusResult.error || 'Unknown pipeline error';
                        console.error('Pipeline failed:', errorMsg);
                        setUploadProgress(null);
                        addAssistantMessage(`⚠️ Pipeline failed for **${file.name}**: ${errorMsg}. You can retry processing from the document list.`);
                        // Still refresh docs to show the failed status
                        const docsData = await api.cases.getDocuments(caseId);
                        setDocuments(docsData);
                        return;
                    } else {
                        // Still processing
                        const progressPercent = Math.min(50 + pollAttempts, 85);
                        setUploadProgress({
                            name: file.name,
                            percent: progressPercent,
                            status: `Processing with AI agents... (${pollAttempts * 3}s elapsed)`
                        });
                    }
                } catch (pollError) {
                    console.warn('Status poll failed, continuing...', pollError.message);
                }
            }

            if (!pipelineDone) {
                // Timed out but pipeline may still be running
                addAssistantMessage(`⏳ Processing **${file.name}** is taking longer than expected. Use the Refresh button on the Timeline/Insights tabs to check for updates.`);
            }

            // Refresh all data from backend
            const docsData = await api.cases.getDocuments(caseId);
            const timelineRes = await api.cases.getTimeline(caseId);
            const insightsRes = await api.cases.getInsights(caseId);

            setDocuments(docsData);
            const timelineData = Array.isArray(timelineRes) ? timelineRes : (timelineRes.data || []);
            const insightsData = Array.isArray(insightsRes) ? insightsRes : (insightsRes.data || []);
            setTimeline(timelineData);
            setInsights(insightsData);
            
            // Update dashboard cases list in state
            const updatedCases = cases.map(c => {
                if (c.id === caseId) {
                    return {
                        ...c,
                        documentsCount: docsData.length,
                        contradictionsCount: insightsData.filter(i => i.type === 'contradiction').length
                    };
                }
                return c;
            });
            setCases(updatedCases);
            
            // If the workspace was selected case, refresh it in parent dashboard cases reference
            const refreshedCase = updatedCases.find(c => c.id === caseId);
            if (refreshedCase) setSelectedCase(refreshedCase);

            setUploadProgress(null);

            if (pipelineDone) {
                addAssistantMessage(`✅ Ingestion successful. Processed **${file.name}**. Found ${timelineData.length} timeline events and ${insightsData.length} investigation findings.`);
            }
        } catch (error) {
            console.error("Document upload failed:", error);
            setUploadProgress(null);
            alert("Document upload failed: " + error.message);
        }
    };

    // Drag-drop events
    const handleDragOver = (e) => {
        e.preventDefault();
        e.currentTarget.style.backgroundColor = "var(--color-parchment-dark)";
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.currentTarget.style.backgroundColor = "var(--color-parchment-cream)";
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.currentTarget.style.backgroundColor = "var(--color-parchment-cream)";
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            uploadFile(files[0]);
        }
    };

    // ==========================================================================
    // REFRESH & RETRY ACTIONS
    // ==========================================================================
    const refreshAnalysisData = async () => {
        if (!selectedCase) return;
        setIsRefreshing(true);
        try {
            const timelineRes = await api.cases.getTimeline(selectedCase.id);
            const insightsRes = await api.cases.getInsights(selectedCase.id);
            setTimeline(Array.isArray(timelineRes) ? timelineRes : (timelineRes.data || []));
            setInsights(Array.isArray(insightsRes) ? insightsRes : (insightsRes.data || []));
        } catch (error) {
            console.error('Refresh failed:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleRetryDocument = async (doc) => {
        if (!selectedCase) return;
        try {
            await api.cases.reprocessDocument(selectedCase.id, doc.id);
            addAssistantMessage(`🔄 Retrying processing for **${doc.name}**...`);
            // Start polling for this document
            const pollForCompletion = async () => {
                let attempts = 0;
                while (attempts < 60) {
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    attempts++;
                    try {
                        const statusResult = await api.cases.getDocumentStatus(selectedCase.id, doc.id);
                        if (statusResult.status === 'completed') {
                            // Refresh all data
                            const docsData = await api.cases.getDocuments(selectedCase.id);
                            const timelineRes = await api.cases.getTimeline(selectedCase.id);
                            const insightsRes = await api.cases.getInsights(selectedCase.id);
                            setDocuments(docsData);
                            setTimeline(Array.isArray(timelineRes) ? timelineRes : (timelineRes.data || []));
                            setInsights(Array.isArray(insightsRes) ? insightsRes : (insightsRes.data || []));
                            addAssistantMessage(`✅ Reprocessing complete for **${doc.name}**.`);
                            return;
                        } else if (statusResult.status === 'failed') {
                            addAssistantMessage(`⚠️ Reprocessing failed for **${doc.name}**: ${statusResult.error || 'Unknown error'}`);
                            const docsData = await api.cases.getDocuments(selectedCase.id);
                            setDocuments(docsData);
                            return;
                        }
                    } catch (e) {
                        console.warn('Retry poll failed:', e.message);
                    }
                }
            };
            pollForCompletion();
        } catch (error) {
            console.error('Retry failed:', error);
            alert('Failed to retry document processing: ' + error.message);
        }
    };

    // ==========================================================================
    // CHAT SYSTEM METHODS
    // ==========================================================================
    const addAssistantMessage = (htmlText) => {
        setChatMessages(prev => [...prev, { sender: 'assistant', text: htmlText, isWarning: false }]);
    };

    const handleSendChatMessage = async (e) => {
        e.preventDefault();
        if (!chatInput.trim()) return;

        const messageText = chatInput.trim();
        setChatMessages(prev => [...prev, { sender: 'user', text: messageText }]);
        setChatInput('');
        setIsTyping(true);

        try {
            const data = await api.cases.sendChatMessage(selectedCase.id, messageText);
            setIsTyping(false);
            // Support both keys just in case
            addAssistantMessage(data.response || data.answer);
        } catch (error) {
            console.error("Chat message failed:", error);
            setIsTyping(false);
            addAssistantMessage(`<p style="color: var(--color-conflict-red);">Failed to communicate with assistant: ${error.message}</p>`);
        }
    };

    // ==========================================================================
    // RENDER INTERFACE
    // ==========================================================================
    return (
        <div className="min-h-screen bg-[#f4f1ea] text-[#190f0a] font-sans">
            
            {/* 1. AUTH SCREEN */}
            {view === 'auth' && (
                <div id="auth-page" className="page-container">
                    <div className="auth-layout">
                        
                        <AuthBanner />

                        {/* Forms Side */}
                        <div className="auth-form-container">
                            <div className="auth-card">
                                
                                <div className="auth-tabs">
                                    <button 
                                        className={`tab-btn ${authTab === 'login' ? 'active' : ''}`}
                                        onClick={() => { setAuthTab('login'); setAuthError(null); }}
                                    >
                                        <i className="fa-solid fa-lock"></i> ADVOCATE LOGIN
                                    </button>
                                    <button 
                                        className={`tab-btn ${authTab === 'register' ? 'active' : ''}`}
                                        onClick={() => { setAuthTab('register'); setAuthError(null); }}
                                    >
                                        <i className="fa-solid fa-user-plus"></i> REGISTER
                                    </button>
                                </div>

                                {authTab === 'login' ? (
                                    <LoginForm 
                                        onSubmit={handleLogin}
                                        email={loginEmail}
                                        setEmail={setLoginEmail}
                                        password={loginPassword}
                                        setPassword={setLoginPassword}
                                        error={authError}
                                    />
                                ) : (
                                    <RegisterForm 
                                        onSubmit={handleRegister}
                                        username={regUsername}
                                        setUsername={setRegUsername}
                                        email={regEmail}
                                        setEmail={setRegEmail}
                                        barId={regBarId}
                                        setBarId={setRegBarId}
                                        password={regPassword}
                                        setPassword={setRegPassword}
                                        confirmPassword={regConfirmPassword}
                                        setConfirmPassword={setRegConfirmPassword}
                                        error={authError}
                                    />
                                )}

                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* 2. DASHBOARD SCREEN */}
            {view === 'dashboard' && (
                <div id="dashboard-page" className="page-container flex flex-col h-screen overflow-hidden">
                    
                    <DashboardHeader 
                        username={user?.username}
                        onLogout={handleLogout}
                    />

                    {/* Subheader */}
                    <div className="dashboard-subheader flex justify-between items-center bg-[#fcfbf7] px-[30px] py-5 border-b border-[#e8e3d5]">
                        <div className="subheader-left">
                            <h1 className="text-xl font-heading font-bold">Active Litigation Archives</h1>
                            <p className="text-xs text-[#4a4e52]">Evolving Case Memory Modules & AI Investigation Inquests</p>
                        </div>
                        <button className="btn btn-gold bg-[#2a1b12] text-[#dfb86c] border border-[#c5a059] px-4 py-2 hover:bg-[#3d2a1d] hover:text-white rounded cursor-pointer text-xs font-semibold" onClick={() => setIsCreateModalOpen(true)}>
                            <i className="fa-solid fa-folder-plus mr-1"></i> Initialize Case File
                        </button>
                    </div>

                    {/* Content */}
                    <main className="dashboard-content flex flex-1 overflow-hidden">
                        
                        <DashboardSidebar 
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            cases={cases}
                        />

                        <CaseGrid 
                            cases={cases}
                            searchQuery={searchQuery}
                            onCaseClick={openCaseWorkspace}
                            onEdit={openEditCaseModal}
                            onDelete={handleDeleteCase}
                        />

                    </main>

                </div>
            )}

            {/* 3. CASE WORKSPACE SCREEN */}
            {view === 'workspace' && selectedCase && (
                <div id="workspace-page" className="page-container flex flex-col h-screen overflow-hidden">
                    
                    <WorkspaceHeader 
                        selectedCase={selectedCase}
                        onBack={navigateToDashboard}
                    />

                    {/* Workspace Body */}
                    <div className="workspace-body flex flex-1 overflow-hidden">
                        
                        {/* LEFT COLUMN: Documents File Repository */}
                        <div className="workspace-pane pane-left w-[38%] border-r border-[#e8e3d5] p-5 overflow-y-auto bg-[#fcfbf7]">
                            <div className="pane-header mb-4">
                                <h3 className="text-[13px] uppercase font-heading font-bold tracking-wide text-[#2a1b12] flex items-center gap-2">
                                    <i className="fa-solid fa-folder-closed"></i> Evidence Files & Documents
                                </h3>
                            </div>

                            <UploadZone 
                                fileInputRef={fileInputRef}
                                onTriggerClick={triggerFileInput}
                                onFileSelect={handleFileSelect}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                uploadProgress={uploadProgress}
                            />

                            <DocumentList 
                                documents={documents}
                                selectedDocument={selectedDocument}
                                onSelectDocument={setSelectedDocument}
                                onRetryDocument={handleRetryDocument}
                            />

                            <FactBox 
                                selectedDocument={selectedDocument}
                                onClose={() => setSelectedDocument(null)}
                            />

                        </div>

                        {/* RIGHT COLUMN: AI Investigation Workspace */}
                        <div className="workspace-pane pane-right w-[62%] bg-[#f4f1ea] flex flex-col h-full overflow-hidden">
                            
                            {/* Tabs */}
                            <div className="workspace-tabs flex bg-[#2a1b12] border-b border-[#c5a059]">
                                <button 
                                    className={`workspace-tab-btn flex-1 py-3 text-center font-heading font-semibold text-[11px] uppercase tracking-wider cursor-pointer ${workspaceTab === 'chat' ? 'active text-[#dfb86c] bg-[#190f0a] shadow-[inset_0_-3px_0_#c5a059]' : 'text-[#e8e3d5]'}`}
                                    onClick={() => setWorkspaceTab('chat')}
                                >
                                    <i className="fa-solid fa-comments mr-1.5"></i> HINDSIGHT CHAT ASSISTANT
                                </button>
                                <button 
                                    className={`workspace-tab-btn flex-1 py-3 text-center font-heading font-semibold text-[11px] uppercase tracking-wider cursor-pointer ${workspaceTab === 'timeline' ? 'active text-[#dfb86c] bg-[#190f0a] shadow-[inset_0_-3px_0_#c5a059]' : 'text-[#e8e3d5]'}`}
                                    onClick={() => setWorkspaceTab('timeline')}
                                >
                                    <i className="fa-solid fa-timeline mr-1.5"></i> CASE TIMELINE
                                </button>
                                <button 
                                    className={`workspace-tab-btn flex-1 py-3 text-center font-heading font-semibold text-[11px] uppercase tracking-wider cursor-pointer ${workspaceTab === 'insights' ? 'active text-[#dfb86c] bg-[#190f0a] shadow-[inset_0_-3px_0_#c5a059]' : 'text-[#e8e3d5]'}`}
                                    onClick={() => setWorkspaceTab('insights')}
                                >
                                    <i className="fa-solid fa-circle-exclamation mr-1.5"></i> CONFLICTS & INSIGHTS 
                                    {insights.length > 0 ? (
                                        <span className="badge badge-alert bg-[#8b0000] text-white px-2 py-0.5 rounded-full ml-1.5 text-[9px] animate-pulse">{insights.length}</span>
                                    ) : (
                                        <span className="badge bg-[#4a4e52] text-white px-2 py-0.5 rounded-full ml-1.5 text-[9px]">0</span>
                                    )}
                                </button>
                            </div>

                            {workspaceTab === 'chat' && (
                                <ChatAssistant 
                                    messages={chatMessages}
                                    isTyping={isTyping}
                                    inputValue={chatInput}
                                    setInputValue={setChatInput}
                                    onSubmit={handleSendChatMessage}
                                    chatMessagesEndRef={chatMessagesEndRef}
                                />
                            )}

                            {workspaceTab === 'timeline' && (
                                <CaseTimeline 
                                    timeline={timeline}
                                    documents={documents}
                                    onSourceClick={setSelectedDocument}
                                    onRefresh={refreshAnalysisData}
                                    isRefreshing={isRefreshing}
                                />
                            )}

                            {workspaceTab === 'insights' && (
                                <ConflictsInsights 
                                    insights={insights}
                                    onRefresh={refreshAnalysisData}
                                    isRefreshing={isRefreshing}
                                />
                            )}

                        </div>

                    </div>
                </div>
            )}

            {/* 4. NEW CASE INITIALIZATION MODAL */}
            <CreateCaseModal 
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreateCase}
                newCaseTitle={newCaseTitle}
                setNewCaseTitle={setNewCaseTitle}
                newCaseDocket={newCaseDocket}
                setNewCaseDocket={setNewCaseDocket}
                newCaseCourt={newCaseCourt}
                setNewCaseCourt={setNewCaseCourt}
                newCaseDesc={newCaseDesc}
                setNewCaseDesc={setNewCaseDesc}
            />

            {/* 5. EDIT CASE MODAL */}
            <EditCaseModal 
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSubmit={handleEditCase}
                editCaseTitle={editCaseTitle}
                setEditCaseTitle={setEditCaseTitle}
                editCaseDocket={editCaseDocket}
                setEditCaseDocket={setEditCaseDocket}
                editCaseCourt={editCaseCourt}
                setEditCaseCourt={setEditCaseCourt}
                editCaseDesc={editCaseDesc}
                setEditCaseDesc={setEditCaseDesc}
            />

        </div>
    );
}
