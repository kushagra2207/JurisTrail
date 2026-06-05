export default function LoginForm({ onSubmit, email, setEmail, password, setPassword, error }) {
    return (
        <form className="auth-form active" onSubmit={onSubmit}>
            <div className="form-header">
                <h2>ADVOCATE ACCESS PORTAL</h2>
                <p>Verify credentials to unlock secured case archives.</p>
            </div>
            {error && (
                <div className="alert-error" style={{
                    backgroundColor: 'rgba(139, 0, 0, 0.1)',
                    color: '#8b0000',
                    border: '1px solid rgba(139, 0, 0, 0.2)',
                    borderRadius: '4px',
                    padding: '10px 15px',
                    fontSize: '11px',
                    fontWeight: '600',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    marginBottom: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <i className="fa-solid fa-triangle-exclamation"></i> {error}
                </div>
            )}
            <div className="form-group">
                <label>REGISTERED EMAIL ADDRESS</label>
                <div className="input-wrapper">
                    <i className="fa-solid fa-envelope input-icon"></i>
                    <input 
                        type="email" 
                        required 
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="advocate@supreme-court.in" 
                    />
                </div>
            </div>
            <div className="form-group">
                <label>SECURITY PASSWORD</label>
                <div className="input-wrapper">
                    <i className="fa-solid fa-key input-icon"></i>
                    <input 
                        type="password" 
                        required 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••" 
                    />
                </div>
            </div>
            <div className="form-actions">
                <a href="#" className="forgot-link">Recover Credentials?</a>
            </div>
            <button type="submit" className="btn btn-primary btn-block">
                <span>Access Case Files</span> <i className="fa-solid fa-arrow-right-to-bracket"></i>
            </button>
        </form>
    );
}
