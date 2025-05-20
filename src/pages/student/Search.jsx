import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Search.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Search = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [filterBy, setFilterBy] = useState('all'); // 'all', 'videos', 'teachers'
  const [sortBy, setSortBy] = useState('relevance'); // 'relevance', 'newest', 'oldest', 'popularity'
  const [isLoading, setIsLoading] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const [filters, setFilters] = useState({
    subject: '',
    branch: '',
    year: ''
  });
  const [specialAccess, setSpecialAccess] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [branches, setBranches] = useState(['CSE', 'CSE-AI', 'CSE-SF', 'ECE', 'EE', 'ME', 'CHE', 'CE']);
  const [years, setYears] = useState(['1st', '2nd', '3rd', '4th']);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(null);

  // Get search query from URL params if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get('q');
    const filter = params.get('filter');
    const sort = params.get('sort');
    const subject = params.get('subject');
    const branch = params.get('branch');
    const year = params.get('year');
    const special = params.get('specialAccess');
    const page = params.get('page');
    
    if (query) setSearchQuery(query);
    if (filter) setFilterBy(filter);
    if (sort) setSortBy(sort);
    if (subject || branch || year) {
      setFilters({
        subject: subject || '',
        branch: branch || '',
        year: year || ''
      });
    }
    if (special === 'true') setSpecialAccess(true);
    if (page) setCurrentPage(parseInt(page, 10));
    
    // Perform search with all the parameters
    performSearch(query, filter, sort, subject, branch, year, page, special === 'true');
  }, [location.search]);

  // Fetch subjects from the API
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await axios.get(`${API_URL}/videos/subjects`);
        if (response.data.success) {
          setSubjects(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching subjects:', err);
      }
    };
    
    fetchSubjects();
  }, []);

  // Perform search
  const performSearch = async (
    query = searchQuery,
    filter = filterBy,
    sort = sortBy,
    subject = filters.subject,
    branch = filters.branch,
    year = filters.year,
    page = currentPage,
    special = specialAccess
  ) => {
    if (!query && !subject && !branch && !year && !special) {
      setResults([]);
      setNoResults(false);
      return;
    }

    setIsLoading(true);
    setNoResults(false);
    setError(null);

    try {
      // Construct search parameters
      const searchParams = new URLSearchParams();
      
      if (query) searchParams.append('search', query);
      if (subject) searchParams.append('subject', subject);
      if (branch) searchParams.append('branch', branch);
      if (year) searchParams.append('year', year);
      if (page) searchParams.append('page', page);
      if (special) searchParams.append('specialAccess', 'true');
      
      // Determine sort parameter
      if (sort === 'newest') {
        searchParams.append('sort', 'createdAt');
        searchParams.append('order', 'desc');
      } else if (sort === 'oldest') {
        searchParams.append('sort', 'createdAt');
        searchParams.append('order', 'asc');
      } else if (sort === 'popularity') {
        searchParams.append('sort', 'views');
        searchParams.append('order', 'desc');
      }
      
      // Limit to 10 results per page
      searchParams.append('limit', '10');
      
      // Make API call
      let response;
      if (filter === 'all' || filter === 'videos') {
        response = await axios.get(`${API_URL}/videos?${searchParams.toString()}`);
      } else if (filter === 'teachers') {
        response = await axios.get(`${API_URL}/users/teachers?${searchParams.toString()}`);
      }
      
      if (response && response.data.success) {
        setResults(response.data.data);
        setTotalPages(response.data.totalPages || 1);
        setNoResults(response.data.data.length === 0);
      } else {
        throw new Error('Failed to fetch search results');
      }
    } catch (err) {
      console.error('Error searching:', err);
      setError('Failed to load search results. Please try again.');
      setNoResults(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search form submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateSearchParams();
  };

  // Update URL parameters and trigger search
  const updateSearchParams = () => {
    const searchParams = new URLSearchParams();
    
    if (searchQuery) searchParams.set('q', searchQuery);
    if (filterBy !== 'all') searchParams.set('filter', filterBy);
    if (sortBy !== 'relevance') searchParams.set('sort', sortBy);
    if (filters.subject) searchParams.set('subject', filters.subject);
    if (filters.branch) searchParams.set('branch', filters.branch);
    if (filters.year) searchParams.set('year', filters.year);
    if (specialAccess) searchParams.set('specialAccess', 'true');
    if (currentPage > 1) searchParams.set('page', currentPage.toString());
    
    navigate(`${location.pathname}?${searchParams.toString()}`);
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    setFilterBy(e.target.value);
    setCurrentPage(1);
    setTimeout(() => updateSearchParams(), 0);
  };

  // Handle sort change
  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setTimeout(() => updateSearchParams(), 0);
  };

  // Handle additional filter changes
  const handleFilterInputChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Handle apply filters
  const handleApplyFilters = () => {
    setCurrentPage(1);
    updateSearchParams();
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    setTimeout(() => updateSearchParams(), 0);
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Format duration from seconds to MM:SS
  const formatDuration = (seconds) => {
    if (!seconds) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="search-page-container">
      {error && <div className="error-message">{error}</div>}
      
      <div className="search-header">
        <form className="search-form" onSubmit={handleSearchSubmit}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for videos, teachers..."
            className="search-input"
          />
          <button type="submit" className="search-button">Search</button>
        </form>
      </div>

      <div className="search-filters">
        <div className="filters-row">
          <div className="filter-group">
            <label>Filter by:</label>
            <select value={filterBy} onChange={handleFilterChange}>
              <option value="all">All Results</option>
              <option value="videos">Videos</option>
              <option value="teachers">Teachers</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Sort by:</label>
            <select value={sortBy} onChange={handleSortChange}>
              <option value="relevance">Relevance</option>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="popularity">Most Viewed</option>
            </select>
          </div>
        </div>
        
        <div className="advanced-filters">
          <h3>Refine Results</h3>
          <div className="filter-inputs">
            <div className="filter-input-group">
              <label>Subject:</label>
              <select 
                name="subject" 
                value={filters.subject} 
                onChange={handleFilterInputChange}
              >
                <option value="">All Subjects</option>
                {subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>
            <div className="filter-input-group">
              <label>Branch:</label>
              <select 
                name="branch" 
                value={filters.branch} 
                onChange={handleFilterInputChange}
              >
                <option value="">All Branches</option>
                {branches.map(branch => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
            </div>
            <div className="filter-input-group">
              <label>Year:</label>
              <select 
                name="year" 
                value={filters.year} 
                onChange={handleFilterInputChange}
              >
                <option value="">All Years</option>
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>Special Access</label>
              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="specialAccess"
                  checked={specialAccess}
                  onChange={(e) => setSpecialAccess(e.target.checked)}
                />
                <label htmlFor="specialAccess">Show videos with special access</label>
              </div>
            </div>
            <button onClick={handleApplyFilters} className="apply-filters-btn">
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-results">
          <div className="loading-spinner"></div>
          <p>Searching...</p>
        </div>
      ) : noResults ? (
        <div className="no-results">
          <h2>No results found</h2>
          <p>Try different keywords or filters</p>
        </div>
      ) : (
        <>
          <div className="search-results">
            {filterBy === 'all' || filterBy === 'videos' ? (
              results.filter(result => !result.role).map(video => (
                <div key={video._id} className="result-card video-card">
                  <Link to={`/student/watch/${video._id}`} className="result-link">
                    <div className="result-thumbnail">
                      <img src={video.thumbnailUrl || 'https://via.placeholder.com/320x180?text=No+Thumbnail'} alt={video.title} />
                      <span className="duration">{formatDuration(video.duration)}</span>
                    </div>
                    <div className="result-details">
                      <h3>{video.title}</h3>
                      <div className="result-meta">
                        <span className="teacher">{video.teacher?.name}</span>
                        <span className="views">{video.views} views</span>
                        <span className="upload-date">{formatDate(video.createdAt)}</span>
                      </div>
                      <p className="result-description">{video.description}</p>
                      <div className="result-tags">
                        <span className="tag">Subject: {video.subject}</span>
                        <span className="tag">Topic: {video.topic}</span>
                        {video.branch && <span className="tag">Branch: {Array.isArray(video.branch) ? video.branch.join(', ') : video.branch}</span>}
                        {video.year && <span className="tag">Year: {Array.isArray(video.year) ? video.year.join(', ') : video.year}</span>}
                      </div>
                    </div>
                  </Link>
                </div>
              ))
            ) : null}
            
            {filterBy === 'all' || filterBy === 'teachers' ? (
              results.filter(result => result.role === 'teacher').map(teacher => (
                <div key={teacher._id} className="result-card teacher-card">
                  <div className="teacher-info">
                    <div className="teacher-avatar">
                      <img src={teacher.profilePicture || 'https://via.placeholder.com/100?text=No+Image'} alt={teacher.name} />
                    </div>
                    <div className="teacher-details">
                      <h3>{teacher.name}</h3>
                      <div className="teacher-meta">
                        <p className="specialization">Branch: {teacher.branch}</p>
                        <p className="video-count">Videos: {teacher.videoCount || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : null}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                Previous
              </button>
              
              <div className="page-numbers">
                {[...Array(totalPages).keys()].map(num => (
                  <button
                    key={num + 1}
                    onClick={() => handlePageChange(num + 1)}
                    className={`page-number ${currentPage === num + 1 ? 'active' : ''}`}
                  >
                    {num + 1}
                  </button>
                ))}
              </div>
              
              <button 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Search; 