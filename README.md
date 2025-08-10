# Spaced Repetition App

A modern, efficient spaced repetition application built with Next.js for learning and retaining knowledge using scientifically-proven spaced repetition techniques.

## 🎯 Project Purpose

This repository serves as an educational project to test and demonstrate the capabilities of **"Vibe Coding"** - a development approach using AI-assisted coding tools and methodologies. The entire application was built collaboratively between a human developer and Claude Code to explore rapid prototyping and iterative development workflows.

## ✨ Features

- **Smart Spaced Repetition**: Implements the SM-2 algorithm for optimal learning intervals
- **Flashcard Management**: Create, edit, and organize flashcards with categories
- **Study Sessions**: Interactive study interface with keyboard shortcuts
- **Progress Tracking**: Detailed statistics and learning analytics
- **Dark/Light Mode**: Complete theme support with system preference detection
- **Category Management**: Organize cards with customizable categories
- **Local Storage**: Client-side data persistence (no server required)
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/samkeen/spaced-repetition-app.git
cd spaced-repetition-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## 🏗️ Architecture

### Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Data Storage**: Browser localStorage

### Key Components

- **Spaced Repetition Algorithm** (`app/lib/spaced-repetition.ts`): SM-2 implementation
- **Storage Layer** (`app/lib/storage.ts`): Abstracted localStorage operations
- **Theme System** (`app/contexts/theme-context.tsx`): Dark/light mode management
- **Study Interface** (`app/study/page.tsx`): Interactive card review system

### Data Storage

The application uses browser localStorage for data persistence with the following structure:

- **Cards**: Flashcard data including scheduling information
- **Categories**: User-defined categories for organization  
- **Progress**: Learning statistics and daily progress tracking
- **Sessions**: Study session history and performance metrics
- **Settings**: User preferences for study behavior

All data is stored client-side, making the app fully functional without a backend server.

### Navigation

The app uses Next.js App Router with the following routes:

- `/` - Homepage and dashboard
- `/study` - Interactive study sessions
- `/cards` - Card management and creation
- `/categories` - Category management
- `/stats` - Progress and statistics

## 🎮 Usage

### Creating Cards

1. Navigate to the Cards section
2. Click "Add New Card"
3. Fill in the front (question) and back (answer)
4. Select or create a category
5. Save the card

### Studying

1. Click "Start Learning" from the homepage
2. Review the question and think of your answer
3. Click "Show Answer" or press Space
4. Rate your recall difficulty (1-4 or use keyboard shortcuts)
5. Continue through your study queue

### Keyboard Shortcuts

- **Space**: Reveal answer during study
- **1-4**: Rate difficulty (Again, Hard, Good, Easy)

## 📁 Project Structure

```
app/
├── cards/           # Card management pages
├── categories/      # Category management  
├── components/      # Reusable UI components
├── contexts/        # React contexts (theme)
├── lib/            # Core business logic
│   ├── spaced-repetition.ts  # SM-2 algorithm
│   └── storage.ts   # localStorage utilities
├── stats/          # Statistics and progress
├── study/          # Study session interface
├── types/          # TypeScript type definitions
└── globals.css     # Global styles and Tailwind
```

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 🤝 Acknowledgments

This project was developed as a collaborative effort between human creativity and AI assistance through Claude Code, demonstrating the potential of AI-augmented software development workflows.