A modern email template builder inspired by Dyspatch, featuring a drag-and-drop editor, real-time preview, and seamless Supabase integration.

## ✨ Features

### 🎨 **Visual Email Editor**
- **Drag-and-Drop Interface**: Intuitive component-based editor
- **Real-time Preview**: See changes instantly as you build
- **Component Library**: Text blocks, images, and more
- **Responsive Design**: Templates that work on all devices

### 📧 **Template Management**
- **Project Organization**: Group templates by projects
- **Template Library**: Browse and manage all your templates
- **Version Control**: Track creation and update dates
- **Export Options**: Generate clean HTML for email campaigns

### 🔐 **User Experience**
- **Secure Authentication**: Powered by Supabase Auth
- **Personal Dashboard**: Overview of projects and recent templates
- **Profile Management**: User account settings
- **Persistent Storage**: All data saved to cloud database

### 🎯 **Customization**
- **Global Styles**: Set project-wide fonts and colors
- **Component Styling**: Individual component customization
- **Theme Support**: Consistent design system

## 🚀 Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Deployment**: Vercel-ready

## 📋 Prerequisites

Before running this project, make sure you have:

- Node.js 18+ installed
- A Supabase account and project
- Git for version control

## ⚡ Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/dyspatch-clone.git
cd dyspatch-clone
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Database Setup
Run the SQL schema in your Supabase dashboard to create the required tables:

```sql
-- Users table (handled by Supabase Auth)
-- Projects table
-- Templates table
-- Check /src/lib/supabase.ts for complete schema
```

### 5. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```
src/
├── app/
│   ├── dashboard/          # Main dashboard
│   ├── editor/             # Template editor
│   ├── login/              # Authentication
│   ├── projects/           # Project management
│   ├── templates/          # Template views
│   └── profile/            # User profile
├── components/
│   └── ui/                 # Reusable UI components
└── lib/
    ├── supabase.ts         # Database client & types
    └── utils.ts            # Utility functions
```

## 🔧 Key Features Walkthrough

### Creating Your First Template
1. **Sign Up/Login** - Create account or sign in
2. **Create Project** - Set up a new email project
3. **Build Template** - Use the drag-and-drop editor
4. **Preview & Export** - Review and generate HTML

### Database Schema
The app uses three main tables:
- **Projects**: Store project info and global styles
- **Templates**: Store template data and components
- **User Management**: Handled by Supabase Auth

## 🚀 Deployment

### Deploy to Vercel
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/dyspatch-clone)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Inspired by [Dyspatch](https://dyspatch.io/)
- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Database and auth by [Supabase](https://supabase.com/)
