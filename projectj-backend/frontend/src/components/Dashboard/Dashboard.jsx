import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiFetch as globalApiFetch } from '../../utils/api';
import logo from '../../assets/logo.png';
import '../Landing/Landing.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Candidate states
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [applyLoading, setApplyLoading] = useState({});

  // Recruiter states
  const [postedJobs, setPostedJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [showPostJobModal, setShowPostJobModal] = useState(false);
  const [newJobRole, setNewJobRole] = useState('');
  const [newJobDesc, setNewJobDesc] = useState('');
  const [newJobSkills, setNewJobSkills] = useState('');
  const [newJobExp, setNewJobExp] = useState('');
  const [postJobLoading, setPostJobLoading] = useState(false);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState({});

  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchData(user);
  }, [user]);

  const apiFetch = async (url, options = {}) => {
    try {
      const res = await globalApiFetch(url, options);
      if (res.status === 401 || res.status === 403) {
        logout();
        navigate('/login');
        return null;
      }
      return res;
    } catch (err) {
      console.error("API call error:", err);
      return null;
    }
  };

  const fetchData = async (userObj) => {
    setLoading(true);
    setError('');
    try {
      if (userObj.role === 'CANDIDATE') {
        const profileRes = await apiFetch('/candidate/profile');
        if (!profileRes) return;
        const profileResult = await profileRes.json();
        if (profileResult.statusCode === 200) {
          setProfile(profileResult.data);
          const [jobsRes, appsRes] = await Promise.all([
            apiFetch('/candidate/get-all-jobs'),
            apiFetch(`/candidate/get-all-applications/${profileResult.data.id}`)
          ]);
          if (jobsRes) { const r = await jobsRes.json(); if (r.statusCode === 200) setJobs(r.data); }
          if (appsRes) { const r = await appsRes.json(); if (r.statusCode === 200) setApplications(r.data); }
        } else {
          setError('Failed to fetch candidate profile');
        }
      } else if (userObj.role === 'RECRUITER') {
        const profileRes = await apiFetch('/recruiter/profile');
        if (!profileRes) return;
        const profileResult = await profileRes.json();
        if (profileResult.statusCode === 200) {
          setProfile(profileResult.data);
          const jobsRes = await apiFetch(`/recruiter/get-jobs-posted/${profileResult.data.id}`);
          if (jobsRes) { const r = await jobsRes.json(); if (r.statusCode === 200) setPostedJobs(r.data); else setPostedJobs([]); }
        } else {
          setError('Failed to fetch recruiter profile');
        }
      }
    } catch (err) {
      setError('An error occurred while fetching data.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error("Logout request failed:", err);
    }
    logout();
    navigate('/');
  };

  // Candidate: Apply for a job
  const handleApply = async (jobId) => {
    if (!profile) return;

    setApplyLoading(prev => ({ ...prev, [jobId]: true }));
    try {
      const response = await apiFetch(`/candidate/apply-job/${profile.id}/${jobId}`, { method: 'POST' });
      if (!response) return;
      const result = await response.json();
      if (result.statusCode === 200) {
        const appsRes = await apiFetch(`/candidate/get-all-applications/${profile.id}`);
        if (appsRes) { const r = await appsRes.json(); if (r.statusCode === 200) setApplications(r.data); }
        alert('Applied successfully!');
      } else {
        alert(result.message || 'Application failed.');
      }
    } catch (err) {
      alert('An error occurred during application.');
    } finally {
      setApplyLoading(prev => ({ ...prev, [jobId]: false }));
    }
  };

  // Recruiter: Post a Job
  const handlePostJob = async (e) => {
    e.preventDefault();
    if (!profile) return;

    setPostJobLoading(true);
    try {
      const jobData = {
        role: newJobRole,
        description: newJobDesc,
        skills: newJobSkills.split(',').map(s => s.trim()).filter(s => s.length > 0),
        experience: parseInt(newJobExp, 10) || 0
      };
      const response = await apiFetch('/recruiter/post-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData)
      });
      if (!response) return;
      const result = await response.json();
      if (result.statusCode === 200) {
        const jobsRes = await apiFetch(`/recruiter/get-jobs-posted/${profile.id}`);
        if (jobsRes) { const r = await jobsRes.json(); if (r.statusCode === 200) setPostedJobs(r.data); }
        setNewJobRole(''); setNewJobDesc(''); setNewJobSkills(''); setNewJobExp('');
        setShowPostJobModal(false);
        alert('Job posted successfully!');
      } else {
        alert(result.message || 'Failed to post job.');
      }
    } catch (err) {
      alert('An error occurred while posting job.');
    } finally {
      setPostJobLoading(false);
    }
  };

  // Recruiter: Update application status
  const handleStatusUpdate = async (appId, newStatus) => {

    setStatusUpdateLoading(prev => ({ ...prev, [appId]: true }));
    try {
      const response = await apiFetch(`/recruiter/update-status/${appId}?applicationStatus=${newStatus}`, { method: 'PATCH' });
      if (!response) return;
      const result = await response.json();
      if (result.statusCode === 200) {
        const jobsRes = await apiFetch(`/recruiter/get-jobs-posted/${profile.id}`);
        if (jobsRes) { const r = await jobsRes.json(); if (r.statusCode === 200) setPostedJobs(r.data); }
      } else {
        alert(result.message || 'Failed to update application status.');
      }
    } catch (err) {
      alert('An error occurred during update.');
    } finally {
      setStatusUpdateLoading(prev => ({ ...prev, [appId]: false }));
    }
  };

  const filteredJobs = jobs.filter(job =>
    (job.role || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (job.skills || []).some(skill => (skill || '').toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'ACCEPTED': return 'status-accepted';
      case 'REJECTED': return 'status-rejected';
      case 'PENDING': return 'status-pending';
      default: return 'status-applied';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Recent';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="landing-layout auth-layout">
        <div className="loading-spinner">Loading dashboard details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="landing-layout auth-layout">
        <div className="auth-card">
          <h2>Dashboard Error</h2>
          <p className="auth-error-banner">{error}</p>
          <button onClick={handleLogout} className="btn-primary w-100">Back to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-layout">
      {/* Header */}
      <header className="navbar-container">
        <div className="navbar-content">
          <div className="navbar-logo">
            <img src={logo} alt="HireSense Logo" className="logo-img" />
            <span className="logo-text">HireSense Dashboard</span>
          </div>
          <div className="navbar-actions">
            <span className="welcome-text">Hello, <strong>{profile?.name}</strong> ({user?.role})</span>
            <button onClick={handleLogout} className="btn-secondary">Log Out</button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-content">
        {user?.role === 'CANDIDATE' ? (
          /* ================================== CANDIDATE VIEW ================================== */
          <div className="candidate-dashboard">
            <div className="dashboard-grid">
              {/* Left Column: Profile Card & Applications */}
              <div className="dashboard-left-col">
                <section className="dashboard-card profile-card" style={{ marginBottom: '24px' }}>
                  <div className="profile-header">
                    <div className="profile-avatar">🎓</div>
                    <div className="profile-info">
                      <h3>{profile?.name}</h3>
                      <p className="profile-email">📧 {profile?.email}</p>
                    </div>
                  </div>
                  <div className="profile-details" style={{ marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                    <p style={{ margin: '8px 0', fontSize: '14px', color: 'var(--text-h)' }}>💼 Experience: <strong>{profile?.experience} Yrs</strong></p>
                    <div style={{ marginTop: '12px' }}>
                      <p style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-h)' }}>Your Skills:</p>
                      <div className="job-skills">
                        {profile?.skills?.map((skill, idx) => (
                          <span key={idx} className="skill-tag">{skill}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                <section className="dashboard-card applications-section">
                  <h2>Your Applications ({applications.length})</h2>
                  {applications.length === 0 ? (
                    <div className="empty-state">You haven't applied to any jobs yet.</div>
                  ) : (
                    <div className="applications-list">
                      {applications.map(app => (
                        <div key={app.id} className="application-item">
                          <div className="app-job-details">
                            <h4>{app.job?.role}</h4>
                            <p>{app.job?.recruiter?.companyName || 'Tech Company'}</p>
                          </div>
                          <span className={`status-badge ${getStatusBadgeClass(app.applicationStatus)}`}>
                            {app.applicationStatus}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>

              {/* Right Column: Search & Job Listings */}
              <section className="dashboard-card jobs-section">
                <div className="jobs-header">
                  <h2>Available Tech Jobs</h2>
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search by role or skill (e.g. Java, React)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {filteredJobs.length === 0 ? (
                  <div className="empty-state">No matching jobs found.</div>
                ) : (
                  <div className="jobs-list">
                    {filteredJobs.map(job => {
                      const alreadyApplied = applications.some(app => app.job?.id === job.id);
                      return (
                        <div key={job.id} className="job-item">
                          <div className="job-details">
                            <h3>{job.role}</h3>
                            <p className="job-company">{job.recruiter?.companyName || 'Tech Company'}</p>
                            <p className="job-desc">{job.description}</p>
                            <div className="job-meta">
                              <span className="job-exp">💼 {job.experience}+ Yrs Exp</span>
                              <span className="job-applicants-count">👥 {job.applications?.length || 0} Applied</span>
                              <span className="job-posted-date">📅 Posted on {formatDate(job.postedAt)}</span>
                              <div className="job-skills">
                                {job.skills.map((skill, idx) => (
                                  <span key={idx} className="skill-tag">{skill}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleApply(job.id)}
                            className="btn-primary"
                            disabled={alreadyApplied || applyLoading[job.id]}
                          >
                            {alreadyApplied ? 'Applied' : applyLoading[job.id] ? 'Applying...' : 'Apply'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          </div>
        ) : (
          /* ================================== RECRUITER VIEW ================================== */
          <div className="recruiter-dashboard">
            <div className="recruiter-header-actions">
              <h2>Your Job Postings ({postedJobs.length})</h2>
              <button onClick={() => setShowPostJobModal(true)} className="btn-primary">
                ➕ Post a New Job
              </button>
            </div>

            {/* Recruiter content grid */}
            <div className="dashboard-grid recruiter-grid">
              {/* Left Column: Profile & Posted Jobs */}
              <div className="dashboard-left-col">
                <section className="dashboard-card profile-card" style={{ marginBottom: '24px' }}>
                  <div className="profile-header">
                    <div className="profile-avatar">💼</div>
                    <div className="profile-info">
                      <h3>{profile?.name}</h3>
                      <p className="profile-company">🏢 {profile?.companyName || 'Company'}</p>
                      <p className="profile-designation">🏷️ {profile?.designation}</p>
                    </div>
                  </div>
                </section>

                <section className="dashboard-card posted-jobs-section">
                  {postedJobs.length === 0 ? (
                    <div className="empty-state">You haven't posted any jobs yet. Click "Post a New Job" to get started.</div>
                  ) : (
                    <div className="posted-jobs-list">
                      {postedJobs.map(job => {
                        const totalApps = job.applications?.length || 0;
                        const acceptedApps = job.applications?.filter(app => app.applicationStatus === 'ACCEPTED').length || 0;
                        const rejectedApps = job.applications?.filter(app => app.applicationStatus === 'REJECTED').length || 0;
                        return (
                          <div
                            key={job.id}
                            className={`posted-job-item ${selectedJobId === job.id ? 'active' : ''}`}
                            onClick={() => setSelectedJobId(job.id)}
                          >
                            <div className="job-info">
                              <h3>{job.role}</h3>
                              <p>{job.description.substring(0, 75)}...</p>
                              <div className="job-stats-breakdown" style={{ marginTop: '8px', display: 'flex', gap: '12px', fontSize: '12px' }}>
                                <span style={{ color: 'var(--text-h)' }}>📊 Total: <strong>{totalApps}</strong></span>
                                <span style={{ color: '#10b981' }}>✅ Accepted: <strong>{acceptedApps}</strong></span>
                                <span style={{ color: '#ef4444' }}>❌ Rejected: <strong>{rejectedApps}</strong></span>
                              </div>
                            </div>
                            <span className="badge-count">
                              {totalApps} Apps
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              </div>

              {/* Right Column: Applications received for selected job */}
              <section className="dashboard-card applicants-section">
                {selectedJobId === null ? (
                  <div className="empty-state selection-prompt">
                    Select a job posting from the left column to view candidate applications.
                  </div>
                ) : (
                  (() => {
                    const selectedJob = postedJobs.find(j => j.id === selectedJobId);
                    if (!selectedJob) return null;
                    const apps = selectedJob.applications || [];
                    return (
                      <div className="job-applications-view">
                        <div className="selected-job-header">
                          <h2>Applications for <strong>{selectedJob.role}</strong></h2>
                          <p>{selectedJob.description}</p>
                        </div>

                        {apps.length === 0 ? (
                          <div className="empty-state">No candidates have applied to this posting yet.</div>
                        ) : (
                          <div className="job-applications-list">
                            {apps.map(app => (
                              <div key={app.id} className="applicant-item">
                                <div className="applicant-info">
                                  <h4>{app.candidate?.name}</h4>
                                  <p className="email">📧 {app.candidate?.email}</p>
                                  <p className="exp">💼 {app.candidate?.experience} Yrs Exp</p>
                                  <div className="skills-row">
                                    {app.candidate?.skills?.map((s, idx) => (
                                      <span key={idx} className="skill-tag">{s}</span>
                                    ))}
                                  </div>
                                </div>
                                <div className="applicant-actions">
                                  <a
                                    href={app.resumeUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-secondary resume-link"
                                  >
                                    📄 View Resume
                                  </a>
                                  
                                  {app.applicationStatus === 'APPLIED' || app.applicationStatus === 'PENDING' ? (
                                    <div className="status-action-btns">
                                      <button
                                        onClick={() => handleStatusUpdate(app.id, 'ACCEPTED')}
                                        className="btn-accept"
                                        disabled={statusUpdateLoading[app.id]}
                                      >
                                        Accept
                                      </button>
                                      <button
                                        onClick={() => handleStatusUpdate(app.id, 'REJECTED')}
                                        className="btn-reject"
                                        disabled={statusUpdateLoading[app.id]}
                                      >
                                        Reject
                                      </button>
                                    </div>
                                  ) : (
                                    <span className={`status-badge ${getStatusBadgeClass(app.applicationStatus)}`}>
                                      {app.applicationStatus}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()
                )}
              </section>
            </div>

            {/* Post Job Modal Dialog */}
            {showPostJobModal && (
              <div className="modal-overlay">
                <div className="modal-card">
                  <div className="modal-header">
                    <h2>Post a New Job Listing</h2>
                    <button onClick={() => setShowPostJobModal(false)} className="close-btn">&times;</button>
                  </div>
                  <form onSubmit={handlePostJob} className="auth-form modal-form">
                    <div className="form-group">
                      <label htmlFor="role">Job Role / Title</label>
                      <input
                        type="text"
                        id="role"
                        required
                        placeholder="Senior React Developer"
                        value={newJobRole}
                        onChange={(e) => setNewJobRole(e.target.value)}
                        disabled={postJobLoading}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="desc">Job Description</label>
                      <textarea
                        id="desc"
                        required
                        placeholder="Looking for a React developer with experience in Vite, state management..."
                        value={newJobDesc}
                        onChange={(e) => setNewJobDesc(e.target.value)}
                        disabled={postJobLoading}
                        className="form-textarea"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="skills">Required Skills (comma separated)</label>
                      <input
                        type="text"
                        id="skills"
                        required
                        placeholder="React, CSS, Vite, REST API"
                        value={newJobSkills}
                        onChange={(e) => setNewJobSkills(e.target.value)}
                        disabled={postJobLoading}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="exp">Required Experience (Years)</label>
                      <input
                        type="number"
                        id="exp"
                        required
                        min="0"
                        placeholder="3"
                        value={newJobExp}
                        onChange={(e) => setNewJobExp(e.target.value)}
                        disabled={postJobLoading}
                      />
                    </div>
                    <div className="modal-actions">
                      <button
                        type="button"
                        onClick={() => setShowPostJobModal(false)}
                        className="btn-secondary"
                        disabled={postJobLoading}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn-primary"
                        disabled={postJobLoading}
                      >
                        {postJobLoading ? 'Posting...' : 'Post Job'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
