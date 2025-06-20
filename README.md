# 🧠 Subconscious AI

A modern, intelligent knowledge management system that helps you capture, organize, and retrieve information effortlessly. Think of it as a digital extension of your brain, where you can store everything from articles and tweets to YouTube videos and personal notes—all in one place.

## ✨ Features

- **Smart Content Capture**: Save documents, tweets, YouTube videos, and web links
- **AI-Powered Organization**: Automatic tagging and categorization
- **Semantic Search**: Find information using natural language
- **Personal Knowledge Graph**: See connections between different pieces of information
- **Secure & Private**: Your data stays yours
- **Clean, Modern UI**: Intuitive interface that works across devices

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or later)
- npm
- Firebase account (for authentication and database)
- OpenAI API key (for embeddings)
- Pinecone account (for vector search)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/subconscious_ai.git
   cd subconscious_ai/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Update .env with your configuration
   ```

4. **Development**
   ```bash
   # Start development server
   npm run dev
   ```

5. **Building for Production**
   ```bash
   # Create production build
   npm run build
   
   # Preview production build locally
   npm run preview:build
   ```

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Create production build with optimizations
- `npm run preview` - Preview production build locally
- `npm run preview:build` - Build and preview production version
- `npm run lint` - Lint TypeScript and React files

## 🏗️ Build Process

The production build includes:
- TypeScript type checking
- Minification and code splitting
- Dead code elimination (tree-shaking)
- Source maps for debugging
- Environment-specific optimizations

## 🚀 Deployment

### Prerequisites
- Node.js v16 or higher
- Environment variables configured in production

### Steps
1. Build the application:
   ```bash
   npm run build
   ```
2. Deploy the contents of the `dist` directory to your hosting service
3. Configure your web server to serve `index.html` for all routes (SPA routing)

### Environment Variables

Create a `.env` file in the frontend directory with the following variables:
```
VITE_API_URL=your_backend_api_url
VITE_FIREBASE_CONFIG=your_firebase_config
```

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS
- **State Management**: React Hooks
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Build Tool**: Vite

## 📦 Dependencies

### Core Dependencies
- `react` ^19.1.0
- `react-dom` ^19.1.0
- `typescript` ~5.8.3

### Development Dependencies
- `@vitejs/plugin-react` ^4.4.1
- `eslint` ^9.25.0
- `vite` ^6.3.5

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📬 Contact

Ayush Mehta - aymehta04@gmail.com

Project Link: [https://github.com/AyushMehta0/subconscious_ai.git](https://github.com/AyushMehta0/subconscious_ai.git)