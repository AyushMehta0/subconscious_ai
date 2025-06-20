import React, { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import type { ChangeEvent } from 'react';
import './App.css';

import { 
  Brain, 
  Plus, 
  Search, 
  Share2, 
  FileText, 
  Video, 
  X, 
  Link as LinkIcon, 
  Trash2,
  LogOut,
  Hash,
  Calendar,
  ExternalLink
} from 'lucide-react';

// --- TypeScript interfaces ---
export type ContentType = 'document' | 'tweet' | 'youtube' | 'link';

export interface Content {
  id: string;
  type: ContentType;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  link?: string;
}

export interface AddContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (content: Omit<Content, 'id' | 'createdAt'> & { tags: string[] }) => Promise<void>;
}

export interface ContentCardProps {
  content: Content;
  onDelete: (id: string) => void;
}

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuth: () => void;
}

const mockApi = {
  auth: {
    signIn: async (email: string, _password: string) => ({ user: { uid: '123', email } }),
    signUp: async (email: string, _password: string, _displayName: string) => ({ user: { uid: '123', email } }),
    signOut: async () => {},
  },
  content: {
    create: async (data: Omit<Content, 'id' | 'createdAt'> & { tags: string[] }) => ({
      id: Date.now().toString(),
      ...data,
      createdAt: new Date(),
    }),
    getAll: async (): Promise<Content[]> => mockContents,
    delete: async (_id: string) => {},
    search: async (query: string): Promise<Content[]> => mockContents.filter(c => 
      c.title.toLowerCase().includes(query.toLowerCase()) ||
      c.content.toLowerCase().includes(query.toLowerCase())
    ),
  },
  brain: {
    share: async (_isPublic: boolean) => ({ shareLink: 'https://example.com/brain/abc123' }),
    getPublic: async (_shareLink: string) => ({ username: 'Demo User', content: mockContents }),
  }
};

const mockContents: Content[] = [
  {
    id: '1',
    type: 'document',
    title: 'How to Build a Second Brain',
    content: 'A comprehensive guide to building your digital knowledge management system...',
    tags: ['productivity', 'learning'],
    createdAt: new Date('2024-09-03'),
    link: 'https://example.com/article',
  },
  {
    id: '2',
    type: 'tweet',
    title: 'Productivity Tip',
    content: 'The best way to learn is to build in public. Share your progress, get feedback, and help others along the way.',
    tags: ['productivity', 'learning'],
    createdAt: new Date('2024-08-03'),
  },
  {
    id: '3',
    type: 'youtube',
    title: 'Deep Work Techniques',
    content: 'Video about maintaining focus in a distracted world',
    tags: ['focus', 'productivity'],
    createdAt: new Date('2024-07-15'),
    link: 'https://youtube.com/watch?v=example',
  },
];

// --- Components ---
const ContentTypeIcon: React.FC<{ type: ContentType; className?: string }> = ({ type, className = "w-4 h-4" }) => {
  const icons: Record<ContentType, React.ElementType> = {
    document: FileText,
    tweet: X, // Replaced Twitter with X
    youtube: Video,
    link: LinkIcon,
  };
  const Icon = icons[type] || FileText;
  return <Icon className={className} />;
};

const ContentCard: React.FC<ContentCardProps> = ({ content, onDelete }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-50 rounded-lg">
            <ContentTypeIcon type={content.type} className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">
              {content.title}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
              <Calendar className="w-3 h-3" />
              {content.createdAt instanceof Date
                ? content.createdAt.toLocaleDateString()
                : new Date(content.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {content.link && (
            <button
              onClick={() => window.open(content.link, '_blank')}
              className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => onDelete(content.id)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <p className="text-gray-600 mb-4 line-clamp-3">{content.content}</p>
      
      {content.tags && content.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {content.tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-full"
            >
              <Hash className="w-3 h-3" />
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

const AddContentModal: React.FC<AddContentModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState<{
    type: ContentType;
    title: string;
    content: string;
    link: string;
    tags: string;
  }>({
    type: 'document',
    title: '',
    content: '',
    link: '',
    tags: '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const tags = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    await onAdd({ ...formData, tags });
    setFormData({ type: 'document', title: '', content: '', link: '', tags: '' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add New Content</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
            <select
              value={formData.type}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, type: e.target.value as ContentType })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="document">📄 Document</option>
              <option value="tweet">🐦 Tweet</option>
              <option value="youtube">📺 YouTube</option>
              <option value="link">🔗 Link</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, title: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Content *</label>
            <textarea
              value={formData.content}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, content: e.target.value })}
              rows={6}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Link (optional)</label>
            <input
              type="url"
              value={formData.link}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, link: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="productivity, learning, notes"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Add Content
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuth }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState<{
    email: string;
    password: string;
    displayName: string;
  }>({
    email: '',
    password: '',
    displayName: '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (isSignUp) {
        await mockApi.auth.signUp(formData.email, formData.password, formData.displayName);
      } else {
        await mockApi.auth.signIn(formData.email, formData.password);
      }
      onAuth();
      onClose();
    } catch (error) {
      console.error('Auth error:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-gray-600 mb-6">
            {isSignUp ? 'Start building your second brain' : 'Sign in to your second brain'}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 pt-0 space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, displayName: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                required
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, password: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            {isSignUp ? 'Create Account' : 'Sign In'}
          </button>
          
          <div className="text-center pt-4">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-purple-600 hover:text-purple-700 text-sm font-medium"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SecondBrainApp: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [contents, setContents] = useState<Content[]>(mockContents);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredContents, setFilteredContents] = useState<Content[]>(mockContents);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [shareLink, setShareLink] = useState<string | null>(null);

  useEffect(() => {
    let filtered = contents;
    
    if (searchQuery) {
      filtered = filtered.filter(content =>
        content.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        content.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        content.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    if (selectedType !== 'all') {
      filtered = filtered.filter(content => content.type === selectedType);
    }
    
    setFilteredContents(filtered);
  }, [contents, searchQuery, selectedType]);

  const handleAuth = () => {
    setIsAuthenticated(true);
  };

  const handleSignOut = async () => {
    await mockApi.auth.signOut();
    setIsAuthenticated(false);
    setContents([]);
    setShareLink(null);
  };

  const handleAddContent = async (contentData: Omit<Content, 'id' | 'createdAt'> & { tags: string[] }) => {
    const newContent = await mockApi.content.create(contentData);
    setContents(prev => [newContent, ...prev]);
  };

  const handleDeleteContent = async (id: string) => {
    await mockApi.content.delete(id);
    setContents(prev => prev.filter(c => c.id !== id));
  };

  const handleShare = async () => {
    const result = await mockApi.brain.share(true);
    setShareLink(result.shareLink);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Brain className="w-12 h-12 text-purple-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Second Brain</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Build your digital knowledge management system. Capture, organize, and discover your ideas with AI-powered semantic search.
            </p>
          </div>
          
          <button
            onClick={() => setShowAuthModal(true)}
            className="px-8 py-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-semibold text-lg shadow-lg hover:shadow-xl"
          >
            Get Started
          </button>
        </div>
        
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onAuth={handleAuth}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-purple-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Second Brain</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Share Brain
              </button>
              
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Content
              </button>
              
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Share Link Alert */}
      {shareLink && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-green-800">Brain shared successfully!</h3>
                <p className="text-sm text-green-600 mt-1">
                  Share this link: <span className="font-mono bg-white px-2 py-1 rounded">{shareLink}</span>
                </p>
              </div>
              <button
                onClick={() => setShareLink(null)}
                className="text-green-400 hover:text-green-600"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64 space-y-6">
            {/* Search */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search your brain..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Content Types</h3>
              <div className="space-y-2">
                {[
                  { id: 'all', label: 'All Notes', icon: Hash },
                  { id: 'document', label: 'Documents', icon: FileText },
                  { id: 'tweet', label: 'Tweets', icon: X },
                  { id: 'youtube', label: 'Videos', icon: Video },
                  { id: 'link', label: 'Links', icon: LinkIcon },
                ].map((type) => {
                  const Icon = type.icon;
                  const count = type.id === 'all' ? contents.length : contents.filter(c => c.type === type.id).length;
                  
                  return (
                    <button
                      key={type.id}
                      onClick={() => setSelectedType(type.id)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                        selectedType === type.id
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{type.label}</span>
                      </div>
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Items</span>
                  <span className="text-sm font-medium text-gray-900">{contents.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">This Month</span>
                  <span className="text-sm font-medium text-gray-900">
                    {contents.filter(c => 
                      c.createdAt.getMonth() === new Date().getMonth() &&
                      c.createdAt.getFullYear() === new Date().getFullYear()
                    ).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Tags Used</span>
                  <span className="text-sm font-medium text-gray-900">
                    {new Set(contents.flatMap(c => c.tags)).size}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedType === 'all' ? 'All Notes' : 
                   selectedType.charAt(0).toUpperCase() + selectedType.slice(1) + 's'}
                </h2>
                <p className="text-gray-600 mt-1">
                  {filteredContents.length} {filteredContents.length === 1 ? 'item' : 'items'}
                  {searchQuery && ` matching "${searchQuery}"`}
                </p>
              </div>
            </div>

            {/* Content Grid */}
            {filteredContents.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchQuery ? 'No results found' : 'No content yet'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery 
                    ? 'Try adjusting your search terms'
                    : 'Start capturing your thoughts and ideas'
                  }
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Your First Content
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredContents.map((content) => (
                  <ContentCard
                    key={content.id}
                    content={content}
                    onDelete={handleDeleteContent}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddContentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddContent}
      />
      </div>
  );
};

export default SecondBrainApp;