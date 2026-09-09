import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../../utils/api';
import logo from '../../assets/logo.png';
import '../Landing/Landing.css';

const Register = () => {
  const [role, setRole] = useState('candidate'); // 'candidate' or 'recruiter'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Candidate fields
  const [skills, setSkills] = useState('');
  const [experience, setExperience] = useState('');
  const [resume, setResume] = useState(null);

  // Recruiter fields
  const [companyName, setCompanyName] = useState('');
  const [designation, setDesignation] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (role === 'candidate') {
        if (!resume) {
          setError('Please upload your resume (PDF/DOC/DOCX).');
          setLoading(false);
          return;
        }

        const formData = new FormData();
        const candidateDetails = {
          name,
          email,
          password,
          skills: skills.split(',').map(s => s.trim()).filter(s => s.length > 0),
          experience: parseInt(experience, 10) || 0
        };

        formData.append('candidate', JSON.stringify(candidateDetails));
        formData.append('resume', resume);

        const response = await apiFetch('/auth/register/candidate', {
          method: 'POST',
          body: formData
        });

        const result = await response.json();
        if (result.statusCode === 200) {
          setSuccess('Registration successful! Redirecting to login...');
          setTimeout(() => navigate('/login'), 2000);
        } else {
          setError(result.message || 'Registration failed.');
        }
      } else {
        const recruiterDetails = {
          name,
          email,
          password,
          companyName,
          designation
        };

        const response = await apiFetch('/auth/register/recruiter', {
          method: 'POST',
          body: JSON.stringify(recruiterDetails)
        });

        const result = await response.json();
        if (result.statusCode === 200) {
          setSuccess('Registration successful! Redirecting to login...');
          setTimeout(() => navigate('/login'), 2000);
        } else {
          setError(result.message || 'Registration failed.');
        }
      }
    } catch (err) {
      setError('An error occurred during registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-layout auth-layout">
      <div className="auth-card-container">
        <div className="auth-card">
          <div className="auth-header">
            <Link to="/" className="auth-logo">
              <img src={logo} alt="HireSense Logo" className="logo-img" />
              <span className="logo-text">HireSense</span>
            </Link>
            <h2>Create an Account</h2>
            <p>Join the HireSense platform to connect with jobs or talent.</p>
          </div>

          <div className="role-selector">
            <button
              type="button"
              className={`role-btn ${role === 'candidate' ? 'active' : ''}`}
              onClick={() => { setRole('candidate'); setError(''); }}
              disabled={loading}
            >
              🎓 Candidate
            </button>
            <button
              type="button"
              className={`role-btn ${role === 'recruiter' ? 'active' : ''}`}
              onClick={() => { setRole('recruiter'); setError(''); }}
              disabled={loading}
            >
              💼 Recruiter
            </button>
          </div>

          {error && <div className="auth-error-banner">{error}</div>}
          {success && <div className="auth-success-banner">{success}</div>}

          <form onSubmit={handleRegister} className="auth-form">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                required
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                required
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Candidate-specific fields */}
            {role === 'candidate' && (
              <>
                <div className="form-group">
                  <label htmlFor="skills">Skills (comma separated)</label>
                  <input
                    type="text"
                    id="skills"
                    required
                    placeholder="Java, Spring Boot, React, SQL"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="experience">Years of Experience</label>
                  <input
                    type="number"
                    id="experience"
                    required
                    min="0"
                    placeholder="2"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="resume">Resume (PDF/DOC/DOCX)</label>
                  <input
                    type="file"
                    id="resume"
                    required
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setResume(e.target.files[0])}
                    disabled={loading}
                  />
                </div>
              </>
            )}

            {/* Recruiter-specific fields */}
            {role === 'recruiter' && (
              <>
                <div className="form-group">
                  <label htmlFor="companyName">Company Name</label>
                  <input
                    type="text"
                    id="companyName"
                    required
                    placeholder="Tech Corp"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="designation">Designation</label>
                  <input
                    type="text"
                    id="designation"
                    required
                    placeholder="HR Manager / Technical Recruiter"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </>
            )}

            <button type="submit" className="btn-primary btn-large w-100" disabled={loading}>
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          <div className="auth-footer">
            <p>Already have an account? <Link to="/login" className="auth-link">Log In</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
