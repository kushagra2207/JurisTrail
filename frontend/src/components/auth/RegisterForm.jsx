export default function RegisterForm({ 
    onSubmit, 
    username, 
    setUsername, 
    email, 
    setEmail, 
    barId, 
    setBarId, 
    password, 
    setPassword,
    confirmPassword,
    setConfirmPassword,
    error
}) {
    return (
        <form className="auth-form active" onSubmit={onSubmit}>
            <div className="form-header">
                <h2>ENROLLMENT REGISTRATION</h2>
                <p>Register as a verified legal counsel.</p>
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
                <label>FULL NAME / TITLE</label>
                <div className="input-wrapper">
                    <i className="fa-solid fa-user-tie input-icon"></i>
                    <input 
                        type="text" 
                        required 
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        placeholder="Adv. Arshit Sharma" 
                    />
                </div>
            </div>
            <div className="form-group">
                <label>OFFICIAL EMAIL ADDRESS</label>
                <div className="input-wrapper">
                    <i className="fa-solid fa-envelope input-icon"></i>
                    <input 
                        type="email" 
                        required 
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="arshit@delhihighcourt.in" 
                    />
                </div>
            </div>
            <div className="form-group">
                <label>BAR COUNCIL ENROLLMENT NUMBER</label>
                <div className="input-wrapper">
                    <i className="fa-solid fa-id-card input-icon"></i>
                    <input 
                        type="text" 
                        value={barId}
                        onChange={e => setBarId(e.target.value)}
                        placeholder="D/1482/2024" 
                    />
                </div>
            </div>
            <div className="form-group">
                <label>DEFINE ACCESS PASSWORD</label>
                <div className="input-wrapper">
                    <i className="fa-solid fa-key input-icon"></i>
                    <input 
                        type="password" 
                        required 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Minimum 8 characters" 
                    />
                </div>
            </div>
            <div className="form-group">
                <label>CONFIRM ACCESS PASSWORD</label>
                <div className="input-wrapper">
                    <i className="fa-solid fa-key input-icon"></i>
                    <input 
                        type="password" 
                        required 
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter access password" 
                    />
                </div>
            </div>
            <button type="submit" className="btn btn-primary btn-block">
                <span>Register Legal Account</span> <i className="fa-solid fa-user-plus"></i>
            </button>
        </form>
    );
}
